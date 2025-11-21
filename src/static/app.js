document.addEventListener("DOMContentLoaded", () => {
  // Register creation form logic
  const registerForm = document.getElementById("register-form");
  const registerMessageDiv = document.getElementById("register-message");
  const registersContainer = document.createElement("section");
  registersContainer.id = "registers-container";
  registersContainer.innerHTML = `<h3>Created Registers</h3><ul id="registers-list"></ul>`;
  document.body.insertBefore(registersContainer, document.getElementById("activities-container"));

  async function fetchRegisters() {
    try {
      const response = await fetch("/registers");
      const registers = await response.json();
      const registersList = document.getElementById("registers-list");
      registersList.innerHTML = "";
      if (registers.length === 0) {
        registersList.innerHTML = "<li>No registers created yet.</li>";
      } else {
        registers.forEach((reg) => {
          const li = document.createElement("li");
          li.textContent = `${reg.date} | ${reg.session} | Year ${reg.year_group} | ${reg.subject} | ${reg.class_name}`;
          registersList.appendChild(li);
        });
      }
    } catch (error) {
      // fail silently
    }
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const date = document.getElementById("register-date").value;
      const session = document.getElementById("register-session").value;
      const year_group = document.getElementById("register-year-group").value;
      const subject = document.getElementById("register-subject").value;
      const class_name = document.getElementById("register-class").value;
      try {
        const response = await fetch("/registers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, session, year_group, subject, class_name })
        });
        const result = await response.json();
        if (response.ok) {
          registerMessageDiv.textContent = result.message;
          registerMessageDiv.className = "success";
          registerForm.reset();
          fetchRegisters();
        } else {
          registerMessageDiv.textContent = result.detail || "An error occurred";
          registerMessageDiv.className = "error";
        }
        registerMessageDiv.classList.remove("hidden");
        setTimeout(() => {
          registerMessageDiv.classList.add("hidden");
        }, 5000);
      } catch (error) {
        registerMessageDiv.textContent = "Failed to create register. Please try again.";
        registerMessageDiv.className = "error";
        registerMessageDiv.classList.remove("hidden");
      }
    });
    fetchRegisters();
  }
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
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
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
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
