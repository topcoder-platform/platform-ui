export const updateUserEmail = jest.fn((userId: string, newEmail: string) => {
    return Promise.resolve({
      data: {
        message: 'Email updated successfully',
        userId,
        email: newEmail,
      },
    });
  });
  