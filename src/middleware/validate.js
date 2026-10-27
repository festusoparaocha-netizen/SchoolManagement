
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: {
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        }
      });
    }

    req.validatedBody = result.data;
    next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: {
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        }
      });
    }

    req.validatedParams = result.data;
    next();
  };
}
