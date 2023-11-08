function Validation(values) {
    let errors = {};
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const passwordPattern = /^(?=.*[a-zA-Z0-9]).{3,}$/;
  
    if (!values.email.trim()) {
      errors.email = "*required";
    } else if (!emailPattern.test(values.email)) {
      errors.email = "Invalid email address";
    } else {
      errors.email = ""
    }
  
    if (!values.password) {
      errors.password = "*required";
    } else if (!passwordPattern.test(values.password)) {
      errors.password = "minimun 3 characters";
    } else {
      errors.password = ""
    }
  
    return errors;
  }
  
  export default Validation;
  