document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message / list
      activitiesList.innerHTML = "";

      // Clear activity select options except the placeholder
      const firstOption = activitySelect.querySelector("option[value='']");
      activitySelect.innerHTML = "";
      if (firstOption) activitySelect.appendChild(firstOption);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section HTML
        let participantsHTML = "";
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          participantsHTML += `<div class="participants-section"><strong>Participants:</strong><ul class="participants-list">`;
          details.participants.forEach((p) => {
            // derive initials from email or name
            const id = (p || "").toString();
            const namePart = id.split("@")[0] || id;
            const initials = namePart
              .split(/[\.\-_ ]+/)
              .map(s => s.charAt(0).toUpperCase())
              .slice(0, 2)
              .join("") || "XX";

            // include a delete button with data attributes to identify activity and email
            participantsHTML += `
              <li>
                <span class="participant-avatar">${initials}</span>
                <span class="participant-email">${id}</span>
                <button class="participant-delete" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(id)}" title="Unregister">🗑️</button>
              </li>`;
          });
          participantsHTML += `</ul></div>`;
        } else {
          participantsHTML += `<div class="participants-empty">No participants yet. Be the first to sign up!</div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Attach click handlers for participant delete buttons within this activity card
        activityCard.querySelectorAll('.participant-delete').forEach((btn) => {
          btn.addEventListener('click', async (event) => {
            const activityName = decodeURIComponent(btn.dataset.activity);
            const email = decodeURIComponent(btn.dataset.email);

            if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

            try {
              const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, {
                method: 'DELETE'
              });

              const data = await resp.json();
              if (resp.ok) {
                // remove the list item from DOM
                const li = btn.closest('li');
                if (li) li.remove();
                // optionally refetch to update availability/badges
                fetchActivities();
              } else {
                alert(data.detail || 'Failed to unregister participant');
              }
            } catch (err) {
              console.error('Error unregistering participant:', err);
              alert('Error unregistering participant. See console for details.');
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refetch activities to update availability
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
