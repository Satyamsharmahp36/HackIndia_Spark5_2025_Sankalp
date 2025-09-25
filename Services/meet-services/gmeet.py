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
            
            # Handle post-signin screens (like home address setup)
            self._handle_post_signin_screens()
            
            return True
        except Exception as e:
            print(f"Google sign-in failed: {e}")
            self._take_screenshot("signin_error.png")
            return False
    
    def _handle_post_signin_screens(self):
        """Handle various screens that appear after Google sign-in"""
        try:
            # Wait a bit for any redirects
            sleep(3)
            
            # Set a timeout for handling post-signin screens
            max_wait_time = 30  # seconds
            start_time = time.time()
            
            # Check for home address setup screen
            while time.time() - start_time < max_wait_time:
                try:
                    # Look for "Set a home address" or similar text
                    page_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
                    if "home address" in page_text or "set a home address" in page_text:
                        print("Detected home address setup screen, attempting to skip...")
                        self._take_screenshot("home_address_screen.png")
                        
                        # Try to find and click "Skip" button with more specific selectors
                        skip_selectors = [
                            "//button[contains(text(), 'Skip')]",
                            "//button[contains(text(), 'Not now')]",
                            "//button[contains(text(), 'Maybe later')]",
                            "//button[contains(@aria-label, 'Skip')]",
                            "//span[contains(text(), 'Skip')]/parent::button",
                            "//div[contains(text(), 'Skip')]/parent::button",
                            "//button[contains(@class, 'skip')]",
                            "//button[contains(@class, 'VfPpkd-LgbsSe') and contains(text(), 'Skip')]",
                            "//button[@jsname='Cuz2Ue' and contains(text(), 'Skip')]"
                        ]
                        
                        skip_clicked = False
                        for selector in skip_selectors:
                            try:
                                skip_button = self.driver.find_element(By.XPATH, selector)
                                if skip_button.is_displayed() and skip_button.is_enabled():
                                    skip_button.click()
                                    print("Successfully clicked Skip button")
                                    sleep(3)
                                    skip_clicked = True
                                    break
                            except:
                                continue
                        
                        # If no skip button found, try pressing Escape or Tab+Enter
                        if not skip_clicked:
                            try:
                                from selenium.webdriver.common.keys import Keys
                                self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
                                sleep(2)
                                print("Pressed Escape key to dismiss dialog")
                            except:
                                pass
                            
                            # Try Tab + Enter as alternative
                            try:
                                self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.TAB)
                                sleep(0.5)
                                self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ENTER)
                                sleep(2)
                                print("Tried Tab + Enter to dismiss dialog")
                            except:
                                pass
                        
                        # Break out of the loop after handling
                        break
                    else:
                        # No home address screen detected, check if we can proceed
                        current_url = self.driver.current_url
                        if "accounts.google.com" not in current_url or "myaccount.google.com" in current_url:
                            print("Successfully navigated away from sign-in screens")
                            break
                        
                        sleep(2)  # Wait a bit before checking again
                        
                except Exception as e:
                    print(f"Error handling home address screen: {e}")
                    break
            
            # If we've been stuck for too long, just proceed
            if time.time() - start_time >= max_wait_time:
                print("Timeout reached while handling post-signin screens, proceeding anyway...")
                self._take_screenshot("post_signin_timeout.png")
            
            # Check for other common post-signin screens
            try:
                # Look for "Turn on 2-Step Verification" or similar
                page_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
                if "2-step verification" in page_text or "two-step verification" in page_text:
                    print("Detected 2-step verification screen, attempting to skip...")
                    self._take_screenshot("2step_verification_screen.png")
                    
                    # Try to find and click "Skip" or "Not now" button
                    skip_selectors = [
                        "//button[contains(text(), 'Skip')]",
                        "//button[contains(text(), 'Not now')]",
                        "//button[contains(text(), 'Maybe later')]",
                        "//span[contains(text(), 'Skip')]/parent::button"
                    ]
                    
                    for selector in skip_selectors:
                        try:
                            skip_button = self.driver.find_element(By.XPATH, selector)
                            if skip_button.is_displayed() and skip_button.is_enabled():
                                skip_button.click()
                                print("Successfully clicked Skip button for 2-step verification")
                                sleep(3)
                                break
                        except:
                            continue
                            
            except Exception as e:
                print(f"Error handling 2-step verification screen: {e}")
            
            # Final screenshot after handling post-signin screens
            self._take_screenshot("after_post_signin_handling.png")
            
        except Exception as e:
            print(f"Error in post-signin screen handling: {e}")
            self._take_screenshot("post_signin_error.png")
    
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
                "meeting has been ended by host",
                "meeting has ended",
                "everyone left",
                "you're the only one here",
                "waiting for others to join"
            ]
            
            if any(phrase in page_text for phrase in end_phrases):
                print(f"Meeting end detected: {[phrase for phrase in end_phrases if phrase in page_text]}")
                return False
            
            # Check for "alone in meeting" indicators
            try:
                # Look for participant count indicators
                participant_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), '1') or contains(text(), 'participant') or contains(text(), 'person')]")
                for element in participant_elements:
                    element_text = element.text.lower()
                    if any(indicator in element_text for indicator in ["1 participant", "1 person", "you're the only one", "waiting for others"]):
                        print("Detected: Bot is alone in the meeting")
                        return False
                
                # Check for "waiting for others" or similar messages
                waiting_indicators = [
                    "waiting for others to join",
                    "you're the only one here",
                    "invite others",
                    "share the meeting link"
                ]
                
                if any(indicator in page_text for indicator in waiting_indicators):
                    print(f"Detected waiting state: {[indicator for indicator in waiting_indicators if indicator in page_text]}")
                    return False
                    
            except Exception as e:
                print(f"Error checking participant count: {e}")
            
            # Check if we're in a "lobby" or "waiting room" state
            try:
                # Look for lobby/waiting room indicators
                lobby_indicators = [
                    "waiting for the host to let you in",
                    "you're in the waiting room",
                    "host will let you in soon",
                    "knock to join"
                ]
                
                if any(indicator in page_text for indicator in lobby_indicators):
                    print(f"Detected lobby/waiting room: {[indicator for indicator in lobby_indicators if indicator in page_text]}")
                    return False
                    
            except Exception as e:
                print(f"Error checking lobby state: {e}")
                
            return True
        except Exception as e:
            print(f"Meeting check error: {e}")
            # Default to True 
            return True
    
    def _is_bot_alone_in_meeting(self):
        """Check if the bot is alone in the meeting (no other participants)"""
        try:
            page_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
            
            # Check for indicators that bot is alone
            alone_indicators = [
                "you're the only one here",
                "waiting for others to join",
                "invite others to join",
                "share the meeting link",
                "1 participant",
                "1 person"
            ]
            
            # Check for specific UI elements that indicate being alone
            try:
                # Look for participant count in the UI
                participant_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), '1') or contains(text(), 'participant') or contains(text(), 'person')]")
                for element in participant_elements:
                    element_text = element.text.lower()
                    if any(indicator in element_text for indicator in ["1 participant", "1 person"]):
                        return True
            except:
                pass
            
            # Check page text for alone indicators
            if any(indicator in page_text for indicator in alone_indicators):
                return True
                
            # Check for empty meeting room indicators
            try:
                # Look for the large avatar in center (indicates only one person)
                avatar_elements = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'avatar') or contains(@class, 'participant')]")
                if len(avatar_elements) == 1:
                    # Check if there's only one large avatar (the bot itself)
                    return True
            except:
                pass
                
            return False
        except Exception as e:
            print(f"Error checking if bot is alone: {e}")
            return False
    
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
                            break
                except:
                    pass
                
                # Check if we're already in the meeting
                current_url = self.driver.current_url
                if "meet.google.com" in current_url and ("/" in current_url.split("meet.google.com/")[-1]):
                    print("Successfully in meeting room")
                    self._take_screenshot("successfully_in_meeting.png")
                    return True
                
                sleep(5)
            
            # Final check - if we're on a meet.google.com URL, consider it successful
            current_url = self.driver.current_url
            if "meet.google.com" in current_url:
                print("Successfully reached meeting URL")
                self._take_screenshot("final_meeting_check.png")
                return True
            
            return False
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
            
        # Google sign in (optional - continue even if it fails)
        email = os.getenv("GMAIL_USER_EMAIL", "")
        password = os.getenv("GMAIL_USER_PASSWORD", "")
        
        signin_success = True
        if email and password:
            signin_success = await self._google_sign_in(email, password)
            if not signin_success:
                print("Google sign-in failed, but continuing to attempt meeting join...")
        
        # Join meeting (this is the critical step)
        meeting_join_success = await self._join_meeting()
        if not meeting_join_success:
            print("Failed to join meeting")
            return False
        
        # If we successfully joined the meeting, consider it a success even if sign-in had issues
        if meeting_join_success and not signin_success:
            print("Successfully joined meeting despite sign-in issues - continuing with recording")
            
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
            
            # Track consecutive "alone in meeting" detections
            alone_count = 0
            max_alone_checks = 3  # Stop after 3 consecutive checks (1.5 minutes) of being alone
            
            while time.time() < end_time and self._is_meeting_active():
                print(f"Meeting active, next check in {check_interval} seconds")
                sleep(check_interval)
                
                # Check if bot is alone in meeting
                if self._is_bot_alone_in_meeting():
                    alone_count += 1
                    print(f"Bot appears to be alone in meeting (check {alone_count}/{max_alone_checks})")
                    
                    if alone_count >= max_alone_checks:
                        print("Bot has been alone in meeting for too long, ending recording")
                        break
                else:
                    # Reset counter if not alone
                    alone_count = 0
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