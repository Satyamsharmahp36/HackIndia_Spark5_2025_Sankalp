# gmeet-bot

This example project will help you record and transcribe using gladia a google meet meeting from a container with a audio and video using virtual sound card (pulseaudio) and screen recording with Xscreen.

One of the main challenge is to record the session without a sound card using audio loop sink and not being flagged by the meeting provider (in this case google meet).

This project is a proof of concept with limited support and is not meant for production grade usage.

## Build:

```
docker build -t gmeet -f Dockerfile .
```

## Usage:

```
docker run -it \
    -e GMEET_LINK=https://meet.google.com/my-gmeet-id \
    -e GMAIL_USER_EMAIL=myuser1234@gmail.com \
    -e GMAIL_USER_PASSWORD=my_gmail_password \
    -e DURATION_IN_MINUTES=1 \ #duration of the meeting to record
    -e GLADIA_API_KEY=YOUR_GLADIA_API_KEY \
    -e GLADIA_DIARIZATION=true \
    -e MAX_WAIT_TIME_IN_MINUTES=2 \ #max wait time in the lobby
    -v $PWD/recordings:/app/recordings \ # local storage for the recording
    -v $PWD/screenshots:/app/screenshots \ # local storage for intermediate bot screenshots
    gmeet
```
```
# Option 1: Host networking (recommended for Linux)
docker run -it --network host \
  -e GMAIL_USER_EMAIL="retr0gmr9@gmail.com" \
  -e GMAIL_USER_PASSWORD="asdfghjklL@" \
  -e GOOGLE_API_KEY="AIzaSyBa_nwjFaausgvUyzaW0-3vdHM3S9pFb3Q" \
  -e SERVER_API="http://localhost:5000" \
  -e MAX_WAIT_TIME_IN_MINUTES="1" \
  -v "$(pwd)/storage:/app/storage" \
  gmeet

# Option 2: Bridge network with host IP (alternative)
# HOST_IP=$(ip route | grep default | awk '{print $3}')
# docker run -it \
#   -e GMAIL_USER_EMAIL="retr0gmr9@gmail.com" \
#   -e GMAIL_USER_PASSWORD="qwertyuiopP@" \
#   -e GOOGLE_API_KEY="AIzaSyCdOl7vPoQGghstD2Q1jGKwiA3g03PupMY" \
#   -e SERVER_API="http://$HOST_IP:5000" \
#   -e MAX_WAIT_TIME_IN_MINUTES="1" \
#   -v "$(pwd)/storage:/app/storage" \
#   gmeet
```
