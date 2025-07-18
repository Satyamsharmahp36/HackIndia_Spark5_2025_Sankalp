import asyncio
import os
import shutil
import subprocess
import click
import datetime
import requests
import json
import sys
import time
import signal
import traceback
from threading import Thread
from time import sleep

import undetected_chromedriver as uc
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException, WebDriverException

class MeetRecorder:
    def __init__(self, meet_link, meet_id):
        self.meet_link = meet_link
        self.meet_id = meet_id
        self.driver = None
        self.record_process = None
        self.recording_active = False
        
        # Setup directories
        self.base_dir = f"storage/{self.meet_id}"
        self.screenshots_dir = f"{self.base_dir}/screenshots"
        self.recordings_dir = f"{self.base_dir}/recordings"
        self.logs_dir = f"{self.base_dir}/logs"
        
        self._setup_directories()
        
    def _setup_directories(self):
        """Create necessary directories if they don't exist"""
        os.makedirs(self.screenshots_dir, exist_ok=True)
        os.makedirs(self.recordings_dir, exist_ok=True)
        os.makedirs(self.logs_dir, exist_ok=True)
        
        # Clear previous screenshots
        for f in os.listdir(self.screenshots_dir):
            os.remove(os.path.join(self.screenshots_dir, f))
    
    def _setup_audio(self):
        """Configure PulseAudio for virtual audio devices"""
        try:
            # Clean previous PulseAudio setup
            subprocess.run("sudo rm -rf /var/run/pulse /var/lib/pulse /root/.config/pulse", 
                          shell=True, check=True)

            # Start PulseAudio in system mode
            subprocess.run(
                "sudo pulseaudio -D --verbose --exit-idle-time=-1 --system --disallow-exit",
                shell=True, check=True
            )

            # Create virtual sinks
            subprocess.run(
                'sudo pactl load-module module-null-sink sink_name=MeetingOutput sink_properties=device.description="Virtual_Meeting_Output"',
                shell=True, check=True
            )
            subprocess.run(
                'sudo pactl load-module module-null-sink sink_name=MicOutput sink_properties=device.description="Virtual_Microphone_Output"',
                shell=True, check=True
            )
            subprocess.run(
                "sudo pactl load-module module-virtual-source source_name=VirtualMic",
                shell=True, check=True
            )

            # Set default devices
            subprocess.run("sudo pactl set-default-source MeetingOutput.monitor", shell=True, check=True)
            subprocess.run("sudo pactl set-default-sink MeetingOutput", shell=True, check=True)
            
            # Create loopback for audio routing
            subprocess.run(
                "sudo pactl load-module module-loopback latency_msec=1 source=MeetingOutput.monitor sink=MicOutput",
                shell=True, check=True
            )
            
            return True
        except subprocess.CalledProcessError as e:
            print(f"Audio setup failed: {e}")
            return False
    
    def _init_browser(self):
        """Initialize undetected Chrome browser"""
        options = uc.ChromeOptions()
        options.add_argument("--use-fake-ui-for-media-stream")
        options.add_argument("--window-size=1920x1080")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-setuid-sandbox")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-application-cache")
        options.add_argument("--disable-dev-shm-usage")
        
        options.add_argument("--log-level=3")
        
        try:
            self.driver = uc.Chrome(
                options=options,
                headless=False
            )
            self.driver.set_window_size(1920, 1080)
            return True
        except Exception as e:
            print(f"Browser initialization failed: {e}")
            return False
    
    async def _google_sign_in(self, email, password):
        """Sign in to Google account"""
        try:
            self.driver.get("https://accounts.google.com")
            sleep(2)
            
            # Email step
            email_field = self.driver.find_element(By.NAME, "identifier")
            email_field.send_keys(email)
            self._take_screenshot("email_entry.png")
            self.driver.find_element(By.ID, "identifierNext").click()
            sleep(5)
            
            # Password step
            password_field = self.driver.find_element(By.NAME, "Passwd")
            password_field.send_keys(password)
            self._take_screenshot("password_entry.png")
            password_field.send_keys(Keys.RETURN)
            sleep(5)
            
            self._take_screenshot("signed_in.png")
            return True
        except Exception as e:
            print(f"Google sign-in failed: {e}")
            self._take_screenshot("signin_error.png")
            return False
    
    def _take_screenshot(self, filename):
        """Take screenshot and save to screenshots directory"""
        try:
            path = os.path.join(self.screenshots_dir, filename)
            self.driver.save_screenshot(path)
        except Exception as e:
            print(f"Failed to take screenshot: {e}")
    
    def _is_meeting_active(self):
        """Check if meeting is still active"""
        try:
            self._take_screenshot(f"meeting_check_{int(time.time())}.png")
            

            current_url = self.driver.current_url
            if "meet.google.com" not in current_url:
                return False
                
            # Check for meeting end indicators
            page_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
            end_phrases = [
                "rejoin", 
                "the meeting has ended",
                "return to home screen",
                "meeting has been ended by host"
            ]
            
            if any(phrase in page_text for phrase in end_phrases):
                return False
                
            return True
        except Exception as e:
            print(f"Meeting check error: {e}")
            # Default to True 
            return True
    
    def _start_recording(self):
        """Start FFmpeg recording process"""
        output_file = os.path.join(self.recordings_dir, "output.mp4")
        log_file = os.path.join(self.logs_dir, "ffmpeg.log")
        
        cmd = (
            f"ffmpeg -y -video_size 1920x1080 -framerate 30 -f x11grab -i :99 "
            f"-f pulse -i MeetingOutput.monitor -af 'highpass=f=200,lowpass=f=3000' "
            f"-c:v libx264 -pix_fmt yuv420p -c:a aac -strict experimental "
            f"-movflags +faststart -f mp4 {output_file}"
        )
        
        try:
            with open(log_file, "wb") as f:
                self.record_process = subprocess.Popen(
                    cmd,
                    shell=True,
                    stdin=subprocess.PIPE,
                    stdout=f,
                    stderr=subprocess.STDOUT,
                    preexec_fn=os.setsid
                )
            
            # Create recording flag file
            with open(os.path.join(self.recordings_dir, "recording_active.flag"), "w") as f:
                f.write("1")
            
            self.recording_active = True
            return True
        except Exception as e:
            print(f"Failed to start recording: {e}")
            return False
    
    def _stop_recording(self):
        """Gracefully stop FFmpeg recording"""
        if not self.record_process or not self.recording_active:
            return
            
        try:
           
            self.record_process.stdin.write(b'q')
            self.record_process.stdin.flush()
            
           
            try:
                self.record_process.wait(timeout=30)
            except subprocess.TimeoutExpired:
                print("FFmpeg didn't stop gracefully, terminating...")
                self.record_process.terminate()
                try:
                    self.record_process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    print("Force killing FFmpeg...")
                    self.record_process.kill()
        
            flag_file = os.path.join(self.recordings_dir, "recording_active.flag")
            if os.path.exists(flag_file):
                os.remove(flag_file)
                
            self.recording_active = False
            return True
        except Exception as e:
            print(f"Error stopping recording: {e}")
            return False
    
    def _verify_recording(self):
        """Verify the recording file is valid"""
        output_file = os.path.join(self.recordings_dir, "output.mp4")
        if not os.path.exists(output_file):
            return False
            
        try:
            result = subprocess.run(
                ["ffmpeg", "-v", "error", "-i", output_file, "-f", "null", "-"],
                stderr=subprocess.PIPE,
                timeout=30
            )
            return result.returncode == 0 and not result.stderr
        except Exception as e:
            print(f"Verification failed: {e}")
            return False
    
    async def _join_meeting(self):
        """Join the Google Meet session"""
        try:
            self.driver.get(self.meet_link)
            sleep(5)
            
            # Grant permissions
            self.driver.execute_cdp_cmd(
                "Browser.grantPermissions",
                {
                    "origin": self.meet_link,
                    "permissions": [
                        "geolocation",
                        "audioCapture",
                        "displayCapture",
                        "videoCapture",
                        "videoCapturePanTiltZoom",
                    ],
                },
            )
            
            self._take_screenshot("initial_page.png")
            
            # Try to dismiss any popups
            try:
                self.driver.find_element(
                    By.XPATH,
                    "//button[contains(., 'Dismiss') or contains(., 'Got it')]"
                ).click()
                sleep(2)
            except:
                pass

            try:
                mic_popup_cancel = self.driver.find_elements(
                    By.CSS_SELECTOR, 
                    "[data-mdc-dialog-action='cancel']"
                )
                for button in mic_popup_cancel:
                    if button.is_displayed():
                        button.click()
                        sleep(1)
                        break
            except:
                pass
            
            # Disable microphone
            try:
                mic_buttons = self.driver.find_elements(
                    By.CSS_SELECTOR, 
                    "[aria-label*='microphone'], [aria-label*='mic'], [data-is-muted]"
                )
                for button in mic_buttons:
                    if button.is_displayed():
                        button.click()
                        sleep(1)
                        break
            except Exception as e:
                print(f"Couldn't disable microphone: {e}")
            
            self._take_screenshot("after_mic_disable.png")
            
            # Enter name if required
            try:
                name_field = self.driver.find_element(By.CSS_SELECTOR, "input[type='text']")
                name_field.send_keys("Meet Recorder")
                sleep(1)
            except:
                pass
                
            # Try to join meeting
            max_attempts = 5
            for attempt in range(max_attempts):
                try:
                    join_buttons = self.driver.find_elements(
                        By.XPATH,
                        "//button[contains(., 'Join') or contains(., 'Ask to join')]"
                    )
                    for button in join_buttons:
                        if button.is_displayed():
                            button.click()
                            sleep(5)
                            self._take_screenshot(f"join_attempt_{attempt}.png")
                            return True
                except:
                    pass
                
                sleep(5)
            
            # If we couldn't find join button, assume we're already in
            return True
        except Exception as e:
            print(f"Meeting join failed: {e}")
            self._take_screenshot("join_error.png")
            return False
    
    async def record(self):
        """Main recording workflow"""
        print(f"Starting recording for meeting {self.meet_id}")
        
        # Setup audio
        if not self._setup_audio():
            return False
            
        # Initialize browser
        if not self._init_browser():
            return False
            
        # Google sign in
        email = os.getenv("GMAIL_USER_EMAIL", "")
        password = os.getenv("GMAIL_USER_PASSWORD", "")
        
        if email and password:
            if not await self._google_sign_in(email, password):
                print("Failed to sign in to Google account")
                return False
        
        # Join meeting
        if not await self._join_meeting():
            print("Failed to join meeting")
            return False
            
        # Start recording
        if not self._start_recording():
            print("Failed to start recording")
            return False
            
        print("Recording started successfully")
        
        # Monitor meeting status
        try:
            check_interval = 30  # seconds
            max_wait_minutes = int(os.getenv("MAX_WAITING_TIME_IN_MINUTES", 60))
            end_time = time.time() + (max_wait_minutes * 60)
            
            while time.time() < end_time and self._is_meeting_active():
                print(f"Meeting active, next check in {check_interval} seconds")
                sleep(check_interval)
        except KeyboardInterrupt:
            print("Received keyboard interrupt, stopping...")
        except Exception as e:
            print(f"Monitoring error: {e}")
        finally:
            print("Stopping recording...")
            self._stop_recording()
            
            # Verify recording
            if self._verify_recording():
                print("Recording completed successfully")
            else:
                print("Recording verification failed - file may be corrupted")
            
            # Close browser
            try:
                if self.driver:
                    self.driver.quit()
            except:
                pass
            
        return True


async def main(meet_link, meet_id):
    recorder = MeetRecorder(meet_link, meet_id)
    await recorder.record()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python recorder.py <meet_link> <meet_id>")
        sys.exit(1)
        
    meet_link = sys.argv[1]
    meet_id = sys.argv[2]
    
    click.echo("Starting Google Meet recorder...")
    asyncio.run(main(meet_link, meet_id))
    click.echo("Recording session completed.")