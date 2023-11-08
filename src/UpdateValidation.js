function Validation(values) {
    let error = {};

    const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const password_pattern = /^(?=.*[a-zA-Z0-9]).{3,}$/;

    if (values.password === "") {
        error.password = "required*";
      } else if (!password_pattern.test(values.password)) {
        error.password = "minimum 3 characters";
      } else {
        error.password = "";
      }
  
    if (values.email === "") {
      error.email = "required*";
    } else if (!email_pattern.test(values.email)) {
      error.email = "format is invalid";
    } else {
      error.email = "";
    }
  
    if (values.newPassword === "") {
      error.newPassword = "required*";
    } else if (!password_pattern.test(values.newPassword)) {
      error.newPassword = "minimum 3 characters";
    } else {
      error.newPassword = "";
    }
  
    return error;
  }
  
  export default Validation;
  