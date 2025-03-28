export default (err, _, res, __) => {
  const { message = 'An error occured', status = 500 } = err;
  res.status(status).send({ message });
};
