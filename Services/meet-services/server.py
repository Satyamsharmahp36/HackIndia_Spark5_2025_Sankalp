from flask import Flask, request, jsonify
import subprocess
import os
import threading
import traceback
import time
import datetime
import requests
import json
import schedule
from audio_processor import process_audio

app = Flask(__name__)

# Minutes before the meeting to start recording
MINUTES_BEFORE_MEETING = 2

def run_recording_process(meeting_link, recording_id, task_id, username):
    """Run the recording process in a separate thread"""
    # Set up command 
    run_cmd = ["python3", "gmeet.py", meeting_link, recording_id]
    print(f"Running command: {' '.join(run_cmd)}")

    process = subprocess.Popen(run_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    # Log output without blocking the response
    stdout_logs = []
    stderr_logs = []

    while True:
        stdout_line = process.stdout.readline()
        stderr_line = process.stderr.readline()

        if stdout_line:
            stdout_logs.append(stdout_line)
            print(f"STDOUT: {stdout_line.strip()}")

        if stderr_line:
            stderr_logs.append(stderr_line)
            print(f"STDERR: {stderr_line.strip()}")

        if stdout_line == '' and stderr_line == '' and process.poll() is not None:
            break

    # Write logs to file for later inspection
    log_path = os.path.join("storage", recording_id, "process.log")
    with open(log_path, 'w') as f:
        f.write(''.join(stdout_logs))
        f.write('\n--- ERRORS ---\n')
        f.write(''.join(stderr_logs))

    print(f"Recording process for {recording_id} completed with return code: {process.returncode}")

    if process.returncode == 0:
        process_recorded_meeting(recording_id, task_id, username)
    else:
        print(f"Recording failed with return code {process.returncode}")

def send_to_api(results, username, task_id, api_url=os.getenv("SERVER_API") + "/update-meeting-info"):
    """Send the results along with username and task_id to the specified API endpoint"""
    try:
        # Create payload with all required information
        payload = {
            "username": username,
            "task_id": task_id,
            "raw_transcript": results["raw_transcript"],
            "adjusted_transcript": results["adjusted_transcript"],
            "meeting_minutes_and_tasks": results["meeting_minutes_and_tasks"]
        }
        
        print(f"Sending data to API: {api_url}")
        response = requests.post(api_url, json=payload)
        
        if response.status_code == 200:
            print("Successfully sent data to API")
            return {"success": True, "response": response.json()}
        else:
            print(f"API request failed with status code: {response.status_code}")
            return {"success": False, "status_code": response.status_code, "response": response.text}
    
    except Exception as e:
        print(f"Error sending data to API: {str(e)}")
        return {"success": False, "error": str(e)}

def process_recorded_meeting(recording_id, task_id, username):
    """Convert the video to audio and process it"""
    storage_dir = os.path.join("storage", recording_id, "recordings")
    
    # Find the recorded video file
    video_files = [f for f in os.listdir(storage_dir) if f.endswith(('.mp4', '.mkv', '.webm'))]
    
    if not video_files:
        print(f"No video files found in {storage_dir}")
        return
    
    video_path = os.path.join(storage_dir, video_files[0])
    audio_path = os.path.join(storage_dir, "audio.mp3")
    
    # Convert video to audio using ffmpeg
    print(f"Converting video to audio: {video_path} -> {audio_path}")
    try:
        result = subprocess.run(
            ["ffmpeg", "-i", video_path, "-q:a", "0", "-map", "a", audio_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        print("Audio conversion completed successfully")
    except subprocess.CalledProcessError as e:
        print(f"Error converting video to audio: {e}")
        print(f"ffmpeg stderr: {e.stderr}")
        return
    
    # Process the audio file
    print(f"Processing audio file: {audio_path}")
    try:
        # Change the working directory temporarily to the storage directory
        original_dir = os.getcwd()
        os.chdir(storage_dir)
        
        # Process the audio
        results = process_audio(
            recording_id=recording_id,
            # audio_file_path=audio_path,
            save_files=True,
        )

        if results:
           api_response = send_to_api(
               results=results,
               username=username,
               task_id=task_id
           )
           # Add API response to results
           results["api_response"] = api_response
        
        # Return to original directory
        os.chdir(original_dir)
        
        print("Audio processing completed successfully")
        return results
    except Exception as e:
        print(f"Error processing audio: {e}")
        # Return to original directory in case of error
        os.chdir(original_dir)
        return None

@app.route('/record_meeting', methods=['POST'])
def record_meeting():
    # Get meeting details from request
    data = request.json
    
    if not data or 'google_meeting_link' not in data:
        return jsonify({"error": "Meeting link is required"}), 400
    
    # Generate a unique ID for this recording
    recording_id = data['google_meeting_link'].split('/')[-1]
    print(f"Recording ID (meeting ID): {recording_id}")

    # Get the current working directory
    current_dir = os.getcwd()
    print(f"Current working directory: {current_dir}")

    # Set base storage path under the current directory
    base_meeting_dir = os.path.join(current_dir, "storage", recording_id)
    recordings_dir = os.path.join(base_meeting_dir, "recordings")
    screenshots_dir = os.path.join(base_meeting_dir, "screenshots")

    print(f"Creating directories at:\n - {recordings_dir}\n - {screenshots_dir}")

    try:
        # Create the necessary directories
        os.makedirs(recordings_dir, exist_ok=True)
        os.makedirs(screenshots_dir, exist_ok=True)
        print("Directories created (or already existed).")
    except Exception as e:
        print(f"Error while creating directories: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Failed to create directories: {str(e)}"}), 500

    # Verify they were created
    if not os.path.isdir(recordings_dir):
        return jsonify({"error": "Failed to verify recordings directory."}), 500
    if not os.path.isdir(screenshots_dir):
        return jsonify({"error": "Failed to verify screenshots directory."}), 500

    print("Directory setup complete.")

    # Start the recording process in a separate thread
    recording_thread = threading.Thread(
        target=run_recording_process,
        args=(data['google_meeting_link'], recording_id, data['taskId'], data['username'])
    )
    recording_thread.daemon = True  # Allows the thread to exit when the main program exits
    recording_thread.start()

    # Immediately return a response
    return jsonify({
        "recording_id": recording_id,
        "status": "started",
        "message": "Meeting recording has been started"
    })

def fetch_upcoming_meetings():
    """Fetch upcoming meetings from the API"""
    try:
        response = requests.get(os.getenv("SERVER_API") + "/meeting-records")
        if response.status_code == 200:
            meetings = response.json()
            print(f"Successfully fetched {len(meetings)} meetings")
            return meetings
        else:
            print(f"Failed to fetch meetings: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error fetching meetings: {str(e)}")
        return []

def check_upcoming_meetings():
    """Check for upcoming meetings and schedule recordings"""
    meetings = fetch_upcoming_meetings()
    now = datetime.datetime.now(datetime.timezone.utc)
    
    for meeting in meetings:
        try:
            # Parse meeting start time
            start_time = datetime.datetime.fromisoformat(meeting["start_time"])
            
            # Calculate the time to start recording (minutes before meeting starts)
            record_time = start_time
            
            # Check if it's time to start recording
            time_until_recording = (record_time - now).total_seconds()

            print(time_until_recording);
            
            if 0 <= time_until_recording <= 120:  # If within 2 minute of scheduled recording time
                print(f"Starting recording for meeting: {meeting['google_meeting_link']}")
                
                # Prepare data for record_meeting endpoint
                meeting_data = {
                    "google_meeting_link": meeting["google_meeting_link"],
                    "taskId": meeting["taskId"],
                    "username": meeting["username"]
                }
                
                try:
                    # Delete the meeting record to prevent re-processing
                    delete_url = f"{os.getenv('SERVER_API')}/delete-meeting-record/{meeting['taskId']}"
                    delete_response = requests.delete(delete_url)
                    
                    if delete_response.status_code == 200:
                        print(f"Successfully deleted meeting record with taskId: {meeting['taskId']}")
                    else:
                        print(f"Failed to delete meeting record: {delete_response.status_code}, {delete_response.text}")
                
                except Exception as e:
                    print(f"Error deleting meeting record: {str(e)}")
                    # Continue with starting the recording even if deletion fails
                
                # Call the record_meeting function directly (not via HTTP)
                threading.Thread(
                    target=start_recording_for_meeting,
                    args=(meeting_data,)
                ).start()
                
        except Exception as e:
            print(f"Error processing meeting {meeting.get('_id', 'unknown')}: {str(e)}")

def start_recording_for_meeting(meeting_data):
    """Start recording for a specific meeting"""
    try:
        # Generate a unique ID for this recording
        recording_id = meeting_data['google_meeting_link'].split('/')[-1]
        
        # Set up directories
        current_dir = os.getcwd()
        base_meeting_dir = os.path.join(current_dir, "storage", recording_id)
        recordings_dir = os.path.join(base_meeting_dir, "recordings")
        screenshots_dir = os.path.join(base_meeting_dir, "screenshots")
        
        os.makedirs(recordings_dir, exist_ok=True)
        os.makedirs(screenshots_dir, exist_ok=True)
        
        # Start the recording process in a separate thread
        run_recording_process(
            meeting_data['google_meeting_link'], 
            recording_id, 
            meeting_data['taskId'], 
            meeting_data['username']
        )
        
        print(f"Recording process completed for meeting: {meeting_data['google_meeting_link']}")
    except Exception as e:
        print(f"Error starting recording: {str(e)}")
        print(traceback.format_exc())

def setup_scheduler():
    """Set up scheduler to periodically check for upcoming meetings"""
    # Check every minute for upcoming meetings
    schedule.every(1).minutes.do(check_upcoming_meetings)
    
    # Run scheduler in a separate thread
    def run_scheduler():
        while True:
            schedule.run_pending()
            time.sleep(1)
    
    scheduler_thread = threading.Thread(target=run_scheduler)
    scheduler_thread.daemon = True
    scheduler_thread.start()
    print("Meeting scheduler started")

if __name__ == '__main__':
    # Start the scheduler
    setup_scheduler()
    
    # Initial check for upcoming meetings
    check_upcoming_meetings()
    
    # Start the Flask app
    app.run(host='0.0.0.0', port=7000)