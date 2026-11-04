
import {
  generateReportCards,
  listReportCards,
  getReportCardById
} from "../services/reportCardService.js";

// Generate report cards for a class, session and term.
export async function generateReportCardsController(req, res, next) {
  try {
    const result = await generateReportCards(req.validatedBody);

    return res.status(201).json({
      success: true,
      message: "Report cards generated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// Retrieve report cards with optional filters.
export async function listReportCardsController(req, res, next) {
  try {
    const result = await listReportCards(req.validatedQuery);

    return res.status(200).json({
      success: true,
      message: "Report cards retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// Retrieve a single report card.
export async function getReportCardController(req, res, next) {
  try {
    const reportCard = await getReportCardById(
      req.validatedParams.id
    );

    return res.status(200).json({
      success: true,
      message: "Report card retrieved successfully",
      data: reportCard
    });
  } catch (error) {
    next(error);
  }
}
