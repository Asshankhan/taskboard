document.addEventListener("DOMContentLoaded", () => {
  const toastEl = document.getElementById("toastMsg");
  const toastBody = toastEl.querySelector(".toast-body");
  const bsToast = new bootstrap.Toast(toastEl);

  function showToast(msg, success = true) {
    toastEl.classList.toggle("text-bg-success", success);
    toastEl.classList.toggle("text-bg-danger", !success);
    toastBody.textContent = msg;
    bsToast.show();
  }

  // Save status
  document.querySelectorAll(".saveStatus").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const status = btn.closest(".task-card").querySelector(".statusSelect").value;
      const res = await fetch(`/tasks/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) showToast("Status updated!");
      else showToast("Error updating!", false);
    });
  });

  // Delete task
  document.querySelectorAll(".deleteTask").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this task?")) return;
      const id = btn.dataset.id;
      const res = await fetch(`/tasks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        btn.closest(".col-md-4").remove();
        showToast("Task deleted!");
      } else showToast("Error deleting!", false);
    });
  });

  // Theme toggle
  const themeBtn = document.getElementById("themeToggle");
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    document.body.classList.toggle("dark-theme");
  });
});
