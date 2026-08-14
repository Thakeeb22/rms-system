function showMessage(elementId, message, type = "error") {
  const element = document.getElementById(elementId);

  if (!element) return;

  element.textContent = message;
  element.classList.remove("hidden");

  if (type === "error") {
    element.classList.remove("text-green-600");
    element.classList.add("text-red-600");
  } else {
    element.classList.remove("text-red-600");
    element.classList.add("text-green-600");
  }
}

function hideMessage(elementId) {
  const element = document.getElementById(elementId);

  if (!element) return;

  element.classList.add("hidden");
}

function setButtonLoading(button, loading, text = "Loading...") {
  if (!button) return;

  if (loading) {
    button.disabled = true;
    button.dataset.originalHTML = button.innerHTML;

    button.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin mr-2"></i>
      ${text}
    `;
  } else {
    button.disabled = false;

    if (button.dataset.originalHTML) {
      button.innerHTML = button.dataset.originalHTML;
      delete button.dataset.originalHTML;
    }
  }
}