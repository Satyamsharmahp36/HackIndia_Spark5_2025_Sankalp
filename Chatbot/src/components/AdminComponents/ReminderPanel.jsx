import React, { useState } from "react";

const ReminderPanel = ({ userId, onAddReminder, reminders }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [googleTask, setGoogleTask] = useState(false);
  const [callReminder, setCallReminder] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const dateTime = new Date(`${date}T${time}`);
    if (!title || !date || !time) {
      alert("Please fill required fields");
      return;
    }
    onAddReminder({
      userId,
      title,
      description,
      datetime: dateTime.toISOString(),
      googleTask,
      callReminder,
    });
    // Reset form
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setGoogleTask(false);
    setCallReminder(false);
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-xl text-white ring-1 ring-gray-700">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-400 drop-shadow-lg">
        Set New Reminder
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          placeholder="Reminder Title *"
          className="w-full p-3 rounded-xl bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Description (optional)"
          className="w-full p-3 rounded-xl bg-gray-700 placeholder-gray-400 text-white resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex gap-4">
          <input
            type="date"
            className="flex-1 p-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <input
            type="time"
            className="flex-1 p-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        <div className="flex gap-8 justify-center text-sm font-medium">
          <label className="inline-flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={googleTask}
              onChange={() => setGoogleTask(!googleTask)}
              className="form-checkbox h-5 w-5 text-blue-500 rounded focus:ring-blue-400"
            />
            <span>Sync with Google Tasks</span>
          </label>
          <label className="inline-flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={callReminder}
              onChange={() => setCallReminder(!callReminder)}
              className="form-checkbox h-5 w-5 text-red-500 rounded focus:ring-red-400"
            />
            <span>Call Reminder</span>
          </label>
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg font-semibold uppercase tracking-wider transition-colors duration-300 drop-shadow-md"
        >
          Add Reminder
        </button>
      </form>

      <div className="mt-10">
        <h3 className="text-2xl font-bold mb-4 border-b border-blue-500 pb-2">
          Upcoming Reminders
        </h3>
        {reminders.length === 0 ? (
          <p className="text-gray-400 italic text-center mt-6">
            No reminders set yet. Create one above!
          </p>
        ) : (
          <ul className="max-h-56 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900 pr-2">
            {reminders.map((r) => (
              <li
                key={r.id}
                className="flex justify-between items-center rounded-xl bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 p-4 shadow-inner"
              >
                <div className="max-w-[70%]">
                  <p className="text-lg font-semibold truncate">{r.title}</p>
                  <p className="text-sm text-gray-300 mt-0.5">
                    {new Date(r.datetime).toLocaleString()}
                  </p>
                  {r.description && (
                    <p className="mt-1 text-xs text-gray-400 line-clamp-2">
                      {r.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-1 text-xs">
                  {r.callReminder && (
                    <span className="bg-red-600 px-2 py-0.5 rounded-full font-bold shadow-md select-none">
                      Call
                    </span>
                  )}
                  {r.googleTask && (
                    <span className="bg-green-600 px-2 py-0.5 rounded-full font-bold shadow-md select-none">
                      Google Task
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ReminderPanel;
