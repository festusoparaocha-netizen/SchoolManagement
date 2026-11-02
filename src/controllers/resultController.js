import {
  createResult,
  listResults,
  getResultById,
  updateResult,
  submitResult,
  approveResult,
  publishResult,
} from "../services/resultService.js";

import {
  listResultsQuerySchema,
} from "../schemas/resultSchema.js";

export async function createResultController(req, res, next) {
  try {
    const result = await createResult(
      req.validatedBody,
      req.user
    );

    return res.status(201).json({
      success: true,
      message: "Student result recorded successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function listResultsController(req, res, next) {
  try {
    const parsed = listResultsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        data: {
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    const response = await listResults(parsed.data, req.user);

    return res.status(200).json({
      success: true,
      message: "Results retrieved successfully",
      data: response,
    });
  } catch (error) {
    next(error);
  }
}

export async function getResultController(req, res, next) {
  try {
    const result = await getResultById(
      req.params.id,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Result retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateResultController(req, res, next) {
  try {
    const result = await updateResult(
      req.params.id,
      req.validatedBody,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Result updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function submitResultController(req, res, next) {
  try {
    const result = await submitResult(
      req.params.id,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Result submitted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function approveResultController(req, res, next) {
  try {
    const result = await approveResult(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Result approved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function publishResultController(req, res, next) {
  try {
    const result = await publishResult(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Result published successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}