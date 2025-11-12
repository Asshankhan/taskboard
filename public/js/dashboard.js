document.addEventListener("DOMContentLoaded", () => {
  const toastEl = document.getElementById("toastMsg");
  const toastBody = toastEl?.querySelector(".toast-body");
  const bsToast = toastEl ? new bootstrap.Toast(toastEl) : null;

  function showToast(msg, success = true) {
    if (!toastEl) return;
    toastEl.classList.toggle("text-bg-success", success);
    toastEl.classList.toggle("text-bg-danger", !success);
    toastBody.textContent = msg;
    bsToast.show();
  }

  // Theme toggle
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      document.body.classList.toggle("light-theme");
      document.body.classList.toggle("dark-theme");
    });
  }

  // Employee delete (Admin)
  document.querySelectorAll(".deleteEmp").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to terminate this employee?")) return;
      const row = btn.closest("tr");
      const id = row.dataset.id;
      console.log('id: ', id);

      const res = await fetch(`/users/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        row.remove();
        showToast("Employee terminated successfully!");
      } else {
        showToast("Error deleting employee", false);
      }
    });
  });
});
