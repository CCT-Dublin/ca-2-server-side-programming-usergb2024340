// Where it's a function to valide what the user input
function validateEntry(data) {
    const errors = {};
    
    // Regex Patterns
    const nameRegex = /^[a-zA-Z0-9]{2,20}$/; // Alphanumeric, 2-20 chars
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format
    const phoneRegex = /^[0-9]{10}$/; // Exactly 10 digits
    const zipRegex = /^[a-zA-Z0-9]{6}$/; // Exactly 6 alphanumeric chars

    // 1. First Name Validation
    if (!data.fname || !nameRegex.test(data.fname)) {
        errors.fname = "First name must be alphanumeric and 2-20 characters long.";
    }

    // 2. Last Name Validation
    if (!data.lname || !nameRegex.test(data.lname)) {
        errors.lname = "Last name must be alphanumeric and 2-20 characters long.";
    }

    // 3. Email Validation
    if (!data.email || !emailRegex.test(data.email)) {
        errors.email = "Please provide a valid email address.";
    }

    // 4. Phone Validation
    if (!data.phone || !phoneRegex.test(data.phone)) {
        errors.phone = "Phone number must be exactly 10 digits.";
    }

    // 5. Zipcode Validation
    if (!data.zipcode || !zipRegex.test(data.zipcode)) {
        errors.zipcode = "Zipcode/Eircode must be exactly 6 characters.";
    }

    return errors;
}

/* this function will prevent the Cross-Site Scripting XXS if the user enter
    an HTML command to a safe entitle */
function cleanInput(input) {
    if (typeof input !== 'string') {
        return input;
    }

    // Map of characters to their safe HTML entity equivalents
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };

    return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

// Export the functions so server.js can use them
module.exports = {
    validateEntry,
    cleanInput
};