from flask import Flask
import subprocess
import os
import datetime

app = Flask(__name__)
@app.route("/htop")
def htop():
    name = "Deepanshu Gupta"
    username = os.getenv("USER", "unknown")
    ist_time = datetime.datetime.utcnow() + datetime.timedelta(hours=5, minutes=30)
    top_output = subprocess.getoutput("top -bn1")
    return f"""
    <html>
    <body>
        <h1>System Info</h1>
        <p><b>Name:</b> {name}</p>
        <p><b>Username:</b> {username}</p>
        <p><b>Server Time (IST):</b> {ist_time.strftime('%Y-%m-%d %H:%M:%S')}</p>
        <h2>Top Output:</h2>
        <pre>{top_output}</pre>
    </body>
    </html>
    """

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
