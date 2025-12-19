//const to handle the submission of both forms using Fetch API
const leadForm = document.getElementById('lead-form');
const bulkForm = document.getElementById('bulk-form');
const statusBox = document.getElementById('status-box');

//Function to clear all previous error messages from the UI
function resetUI() {
    statusBox.innerHTML = '';
    const errorSpans = document.querySelectorAll('.err-msg');
    errorSpans.forEach(span => span.textContent = '');
}

// Function to map errors to specific fields
function mapErrorsToFields(errors) {
    for (const fieldName in errors) { //for to navigate through the errors object
        const spanId = `err-${fieldName}`;
        const spanElement = document.getElementById(spanId);
        if (spanElement) {
            spanElement.textContent = errors[fieldName];
            spanElement.style.color = "#ffcc00"; // Highlight error text
        }
    }
}

// Asynchronous Function to handle form submissions via AJAX (Fetch)
async function handleSubmission(event, formType) {
    event.preventDefault(); // Prevent default form submission
    resetUI(); //calling the function to reset the UI

    const form = event.target;
    const formData = new FormData(form);
    const actionUrl = form.action;

    //block to try the fetch request
    try {
        let fetchOptions = { method: 'POST' };

        // Logic for Single Entry (URL-Encoded) vs Bulk Upload (Multipart)
        if (formType === 'manual') {
            const params = new URLSearchParams(formData);
            fetchOptions.body = params.toString();
            fetchOptions.headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };
        } else {
            // Multer handles multipart/form-data automatically
            fetchOptions.body = formData;
        }

        const response = await fetch(actionUrl, fetchOptions);
        const data = await response.json();

        if (response.ok) {
            // Success Scenario
            statusBox.style.color = "#00ff00";
            statusBox.innerHTML = `<strong>SUCCESS:</strong> ${data.msg || 'Action completed.'}`;
            form.reset();
        } else {
            // Error Scenario (Validation or Server Error)
            statusBox.style.color = "#ffcc00";
            statusBox.innerHTML = `<strong>ERROR:</strong> ${data.msg || 'Validation failed.'}`;
            
            if (data.errors) {
                mapErrorsToFields(data.errors);
            }
        }

    } catch (err) {
        console.error("Gateway Error:", err);
        statusBox.style.color = "red";
        statusBox.innerHTML = "<strong>CRITICAL:</strong> Unable to reach the server.";
    }
}

// Attach listeners to both forms
leadForm.addEventListener('submit', (e) => handleSubmission(e, 'manual'));
bulkForm.addEventListener('submit', (e) => handleSubmission(e, 'bulk'));