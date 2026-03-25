import { createParamDecorator } from '@nestjs/common';

import { getCurrentUser } from '@repo/logger';

// ----------------------------------------------------------------------------

export const CurrentUser = createParamDecorator((data: string | undefined) => {
  const user = getCurrentUser();
  return data ? user?.[data] : user;
});
