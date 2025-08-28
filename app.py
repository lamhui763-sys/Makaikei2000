import os
from datetime import datetime, timedelta

from flask import Flask, render_template, request, redirect, url_for, flash
from amadeus import Client, ResponseError
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
import requests

# load env
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret")

# Amadeus client
amadeus = Client(
    client_id=os.getenv("AMADEUS_API_KEY"),
    client_secret=os.getenv("AMADEUS_API_SECRET")
)

scheduler = BackgroundScheduler()
scheduler.start()

def schedule_trip_email(user_email, origin, destination, depart_date, return_date):
    # run job 3 days before departure at 09:00
    depart_dt = datetime.strptime(depart_date, "%Y-%m-%d")
    run_time = depart_dt - timedelta(days=3)
    run_time = run_time.replace(hour=9, minute=0, second=0)

    scheduler.add_job(
        func=prepare_and_send_report,
        trigger="date",
        run_date=run_time,
        args=[user_email, origin, destination, depart_date, return_date]
    )


def prepare_and_send_report(user_email, origin, destination, depart_date, return_date):
    # TODO: implement data fetching and email sending
    print("Preparing report for", user_email)


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        user_email = request.form["email"]
        origin = request.form["origin"]
        destination = request.form["destination"]
        depart_date = request.form["depart_date"]
        trip_length = int(request.form["trip_length"])
        depart_dt = datetime.strptime(depart_date, "%Y-%m-%d")
        return_dt = depart_dt + timedelta(days=trip_length)

        schedule_trip_email(user_email, origin, destination, depart_date, return_dt.strftime("%Y-%m-%d"))
        flash("Your trip has been scheduled! You will receive details 3 days before departure.")
        return redirect(url_for("index"))
    return render_template("index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)