
import {
  createSubject,
  listSubjects,
  getSubjectById,
  updateSubject
} from "../services/subjectService.js";

export async function createSubjectController(req, res, next) {
  try {
    const subject = await createSubject(req.validatedBody);

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: { subject }
    });
  } catch (error) {
    next(error);
  }
}

export async function listSubjectsController(req, res, next) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const search = req.query.search?.trim();

    if (
      !Number.isInteger(page) || page < 1 ||
      !Number.isInteger(limit) || limit < 1 || limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
        data: null
      });
    }

    const result = await listSubjects({ page, limit, search });

    return res.status(200).json({
      success: true,
      message: "Subjects retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getSubjectController(req, res, next) {
  try {
    const subject = await getSubjectById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Subject retrieved successfully",
      data: { subject }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSubjectController(req, res, next) {
  try {
    const subject = await updateSubject(
      req.params.id,
      req.validatedBody
    );

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: { subject }
    });
  } catch (error) {
    next(error);
  }
}
