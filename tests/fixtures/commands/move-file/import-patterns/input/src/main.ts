import { formatName } from './utils/helper';
import { logger } from './services/logger';
import { Button } from './components';
import { formatDate } from './deep/nested/utils/formatter';
import { validateUser } from './user/user-validator';

const user = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };

const formattedName = formatName(user.firstName, user.lastName);
const formattedDate = formatDate(new Date());
const isValid = validateUser(user);

logger.info(`User: ${formattedName}`);
logger.info(`Date: ${formattedDate}`);
logger.info(`Valid: ${isValid}`);

const button = new Button('Submit');
button.render();