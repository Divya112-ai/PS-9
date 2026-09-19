/**
 * Wraps an async Express controller to automatically forward errors
 * to the global error handler. Removes repetitive try/catch blocks.
 *
 * Usage:
 *   router.get('/foo', asyncHandler(async (req, res) => {
 *     const data = await SomeModel.find();
 *     res.json({ data });
 *   }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;