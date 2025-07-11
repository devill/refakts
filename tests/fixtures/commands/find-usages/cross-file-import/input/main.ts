import { formatName, calculateAge, DEFAULT_GREETING } from './utils/helpers';
import { Button } from './components/button';

interface User {
  firstName: string;
  lastName: string;
  birthYear: number;
}

function processUser(user: User): void {
  const fullName = formatName(user.firstName, user.lastName);
  const age = calculateAge(user.birthYear);
  
  console.log(`${DEFAULT_GREETING} ${fullName}, you are ${age} years old.`);
  
  const button = new Button(formatName(user.firstName, user.lastName));
  button.render();
}

const testUser: User = {
  firstName: "John",
  lastName: "Doe", 
  birthYear: 1990
};

processUser(testUser);