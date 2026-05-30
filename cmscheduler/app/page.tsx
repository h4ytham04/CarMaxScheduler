"use client";

import { useState } from "react";

export default function Home() {
  const [accepted, setAccepted] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleAgree = () => {
    setClosing(true);
    setTimeout(() => {
      setAccepted(true);
    }, 200); // Match the duration of the fade-out animation
  };

  return (
    <div className="relative min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold text-center">CarMax Scheduler</h1>
        <p className="mt-6 text-center text-lg text-slate-700">
          Manage your employees and schedules with ease. Use the buttons below to navigate through the app.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button className="rounded-full bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700">
            Edit Associates
          </button>
          <button className="rounded-full bg-purple-600 px-6 py-3 text-white transition hover:bg-purple-700">
            Generate Schedule
          </button>
          <button className="rounded-full bg-green-600 px-6 py-3 text-white transition hover:bg-green-700">
            View Schedule
          </button>
        </div>
      </div>

      {!accepted && (
        <>
          <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`} />

          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`}>
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <img
                className="w-full rounded-2xl"
                src="/SCHEDULE_MAX.png"
                alt="CarMax Logo"
              />
              <div className="mt-6 space-y-4 text-center">
                <h2 className="text-2xl font-semibold">Welcome to ScheduleMax!</h2>
                <p className="text-slate-600">
                  <strong>ScheduleMax is not affiliated with CarMax. This is a project by an associate from store 6013 to assist for internal scheduling.
                  </strong>
                  This web app helps you manage employees and create weekly schedules. You can edit associate information, generate schedules based on availability and preferences, 
                  and view the final schedule in an easy-to-read format. Along with that, you can consult the AI for any special scheduling requests needed to be made. This is a tool
                  for BOMs to create weekly schedules automatically rather than using Dimensions' scheduling tool. <strong> Clearing Cache from this site will reset all your data. </strong> 
                  Please click "I Agree" to acknowledge that you understand this is an unofficial tool and not endorsed by CarMax.
                </p>
                <button
                  onClick={handleAgree}
                  className="w-full rounded-full bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700"
                >
                  I Agree
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
