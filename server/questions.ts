export interface Question { text: string; options: string[]; correct: number; category: string; }

export const QUESTION_BANK: Question[] = [
  { text: 'Which planet has the shortest day?', options: ['Mars', 'Jupiter', 'Mercury', 'Venus'], correct: 1, category: 'SPACE' },
  { text: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correct: 2, category: 'GEOGRAPHY' },
  { text: 'Who painted The Starry Night?', options: ['Monet', 'Van Gogh', 'Picasso', 'Klimt'], correct: 1, category: 'ART' },
  { text: 'Which element has the symbol Au?', options: ['Silver', 'Argon', 'Gold', 'Copper'], correct: 2, category: 'SCIENCE' },
  { text: 'In computing, what does CPU stand for?', options: ['Core Processing Utility', 'Central Processing Unit', 'Computer Primary Unit', 'Central Program User'], correct: 1, category: 'TECH' },
  { text: 'Which ocean is the largest?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correct: 3, category: 'GEOGRAPHY' },
  { text: 'How many players are on a soccer team on the field?', options: ['9', '10', '11', '12'], correct: 2, category: 'SPORT' },
  { text: 'Which language has the most native speakers?', options: ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'], correct: 2, category: 'CULTURE' },
  { text: 'What year did the first iPhone launch?', options: ['2005', '2006', '2007', '2008'], correct: 2, category: 'TECH' },
  { text: 'What is the hardest natural substance?', options: ['Quartz', 'Diamond', 'Steel', 'Obsidian'], correct: 1, category: 'SCIENCE' },
  { text: 'Which band recorded “Bohemian Rhapsody”?', options: ['ABBA', 'Queen', 'The Beatles', 'Pink Floyd'], correct: 1, category: 'MUSIC' },
  { text: 'What is the smallest prime number?', options: ['0', '1', '2', '3'], correct: 2, category: 'MATH' },
  { text: 'Which country gifted the Statue of Liberty to the USA?', options: ['Italy', 'Spain', 'France', 'Canada'], correct: 2, category: 'HISTORY' },
  { text: 'Which animal is known for having three hearts?', options: ['Dolphin', 'Octopus', 'Shark', 'Penguin'], correct: 1, category: 'NATURE' },
  { text: 'What is the chemical formula for water?', options: ['CO₂', 'H₂O', 'O₂', 'NaCl'], correct: 1, category: 'SCIENCE' },
  { text: 'Which film features the line “I’ll be back”?', options: ['Rocky', 'Alien', 'The Terminator', 'Die Hard'], correct: 2, category: 'MOVIES' },
  { text: 'How many sides does a dodecagon have?', options: ['10', '11', '12', '14'], correct: 2, category: 'MATH' },
  { text: 'Which continent contains the Sahara Desert?', options: ['Asia', 'Africa', 'Australia', 'South America'], correct: 1, category: 'GEOGRAPHY' },
  { text: 'What does DNA stand for?', options: ['Dynamic Nucleic Acid', 'Deoxyribonucleic Acid', 'Dual Nitrogen Atom', 'Defined Nuclear Array'], correct: 1, category: 'SCIENCE' },
  { text: 'Which chess piece can jump over others?', options: ['Bishop', 'Rook', 'Knight', 'Queen'], correct: 2, category: 'GAMES' }
];

export function pickQuestions(count = 10): Question[] {
  return [...QUESTION_BANK].sort(() => Math.random() - 0.5).slice(0, count);
}
