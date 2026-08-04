function showMessage(elementId, message, type = "error") {
  const element = document.getElementById(elementId);
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
  document.getElementById(elementId).classList.add("hidden");
}
function setButtonLoading(button, loading, text = "Loading...") {
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = text;
    return;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText;
  }
}
