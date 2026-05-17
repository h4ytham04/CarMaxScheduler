'use client'

import { useRouter } from "next/navigation";

export default function Home() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-center p-4">CarMax Scheduler</h1>

    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <p className="text-lg text-center mt-4">
        This application allows you to manage and schedule appointments for CarMax services. 
        You can view, create, and edit your appointments with ease.
      </p>

      <div className="mt-6 flex space-x-4">
      <button className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Edit Associates
      </button>
      
      <button className="mt-6 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
        Generate Schedule
      </button>

      <button className="mt-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        View Schedule
      </button>

      </div>

    </div>

    </div>

  );
}
