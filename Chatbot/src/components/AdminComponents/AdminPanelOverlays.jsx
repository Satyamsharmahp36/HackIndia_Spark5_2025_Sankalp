import React from "react";
import { AnimatePresence } from "framer-motion";
import SelfTaskForm from "./SelfTaskForm";
import CalendarMeetingForm from "./CalendarMeetingForm";
import MeetingDetailsPopup from "./MeetingDetailsPopup";
import CalendarScheduler from "./CalendarScheduler";
import { X } from "lucide-react";

const AdminPanelOverlays = ({
  showSelfTask,
  handleSelfTaskToggle,
  handleRefreshUserData,
  setShowSelfTask,
  userData,
  showScheduler,
  meetingDetails,
  handleFormSubmit,
  handleCloseScheduler,
  showCalendarScheduler,
  calendarData,
  showMeetingDetailsPopup,
  selectedMeeting,
  setShowMeetingDetailsPopup,
}) => (
  <>
    <AnimatePresence>
      {showSelfTask && (
        <SelfTaskForm
          userData={userData}
          onClose={() => {
            handleSelfTaskToggle();
            handleRefreshUserData();
          }}
          onSuccess={() => {
            handleRefreshUserData();
            setShowSelfTask(false);
          }}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showScheduler && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <CalendarMeetingForm
            initialData={meetingDetails}
            onSchedule={handleFormSubmit}
            onClose={handleCloseScheduler}
          />
        </div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showCalendarScheduler && calendarData && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-gray-900 rounded-xl p-4 w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                Calendar Integration
              </h3>
              <button
                onClick={handleCloseScheduler}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2">
              <CalendarScheduler
                taskId={calendarData.taskId}
                username={userData.user.username}
                title={calendarData.title}
                description={calendarData.description}
                startTime={calendarData.startTime}
                endTime={calendarData.endTime}
                userEmails={calendarData.userEmails}
                onSuccess={handleRefreshUserData}
              />
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showMeetingDetailsPopup && selectedMeeting && (
        <MeetingDetailsPopup
          meeting={selectedMeeting}
          onClose={() => setShowMeetingDetailsPopup(false)}
        />
      )}
    </AnimatePresence>
  </>
);

export default AdminPanelOverlays; 