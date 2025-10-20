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

            participantsHTML += `
              <li>
                <span class="participant-avatar">${initials}</span>
                <span class="participant-email">${id}</span>
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
