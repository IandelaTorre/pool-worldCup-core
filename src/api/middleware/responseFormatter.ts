export const successResponse = (data: any, statusCode: number = 200) => {
  return {
    data,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  };
};
