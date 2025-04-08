from flask import Flask
import subprocess
import os
import datetime

app = Flask(__name__)

@app.route("/")  # Add this route for testing
def home():
    return "<h1>Flask Server is Running</h1><p>Try visiting /htop</p>"

@app.route("/htop")
def htop():
    # Get system username
    username = os.getenv("USER", "unknown user")
    
    # Get server time in IST
    ist_time = datetime.datetime.utcnow() + datetime.timedelta(hours=5, minutes=30)
    
    # Run `top` command and get the output
    top_output = subprocess.getoutput("top -bn1")

    # Format output
    response = f"""
    <h1>System Info</h1>
    <p><b>Name:</b> Deepanshu Gupta</p>
    <p><b>Username:</b> {username}</p>
    <p><b>Server Time (IST):</b> {ist_time.strftime('%Y-%m-%d %H:%M:%S')}</p>
    <pre>{top_output}</pre>
    """
    
    return response

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)  # Added debug mode
