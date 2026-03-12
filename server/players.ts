export type Role = 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';

export interface Player {
  id: string;
  name: string;
  role: Role;
  rating: number;
  basePrice: number; // in Cr
  battingRating: number;
  bowlingRating: number;
  recentForm: 'hot' | 'average' | 'cool';
  nationality: string;
}

export const PLAYERS: Player[] = [
  { id: '1', name: 'Virat Kohli', role: 'Batsman', rating: 95, basePrice: 2.0, battingRating: 98, bowlingRating: 20, recentForm: 'hot', nationality: 'India' },
  { id: '2', name: 'Jasprit Bumrah', role: 'Bowler', rating: 96, basePrice: 2.0, battingRating: 15, bowlingRating: 99, recentForm: 'hot', nationality: 'India' },
  { id: '3', name: 'Hardik Pandya', role: 'All-rounder', rating: 92, basePrice: 2.0, battingRating: 88, bowlingRating: 85, recentForm: 'average', nationality: 'India' },
  { id: '4', name: 'MS Dhoni', role: 'Wicketkeeper', rating: 90, basePrice: 2.0, battingRating: 85, bowlingRating: 10, recentForm: 'average', nationality: 'India' },
  { id: '5', name: 'Rohit Sharma', role: 'Batsman', rating: 93, basePrice: 2.0, battingRating: 95, bowlingRating: 30, recentForm: 'hot', nationality: 'India' },
  { id: '6', name: 'Rashid Khan', role: 'Bowler', rating: 94, basePrice: 2.0, battingRating: 70, bowlingRating: 97, recentForm: 'hot', nationality: 'Afghanistan' },
  { id: '7', name: 'Ben Stokes', role: 'All-rounder', rating: 91, basePrice: 2.0, battingRating: 90, bowlingRating: 80, recentForm: 'cool', nationality: 'England' },
  { id: '8', name: 'Jos Buttler', role: 'Wicketkeeper', rating: 92, basePrice: 2.0, battingRating: 94, bowlingRating: 0, recentForm: 'hot', nationality: 'England' },
  { id: '9', name: 'Suryakumar Yadav', role: 'Batsman', rating: 94, basePrice: 2.0, battingRating: 97, bowlingRating: 10, recentForm: 'hot', nationality: 'India' },
  { id: '10', name: 'Trent Boult', role: 'Bowler', rating: 90, basePrice: 2.0, battingRating: 25, bowlingRating: 93, recentForm: 'average', nationality: 'New Zealand' },
  { id: '11', name: 'Ravindra Jadeja', role: 'All-rounder', rating: 93, basePrice: 2.0, battingRating: 85, bowlingRating: 92, recentForm: 'hot', nationality: 'India' },
  { id: '12', name: 'KL Rahul', role: 'Wicketkeeper', rating: 89, basePrice: 2.0, battingRating: 91, bowlingRating: 0, recentForm: 'average', nationality: 'India' },
  { id: '13', name: 'Shubman Gill', role: 'Batsman', rating: 91, basePrice: 1.5, battingRating: 93, bowlingRating: 15, recentForm: 'average', nationality: 'India' },
  { id: '14', name: 'Kagiso Rabada', role: 'Bowler', rating: 92, basePrice: 2.0, battingRating: 30, bowlingRating: 95, recentForm: 'average', nationality: 'South Africa' },
  { id: '15', name: 'Glenn Maxwell', role: 'All-rounder', rating: 89, basePrice: 2.0, battingRating: 92, bowlingRating: 65, recentForm: 'hot', nationality: 'Australia' },
  { id: '16', name: 'Rishabh Pant', role: 'Wicketkeeper', rating: 91, basePrice: 2.0, battingRating: 91, bowlingRating: 0, recentForm: 'hot', nationality: 'India' },
  { id: '17', name: 'David Warner', role: 'Batsman', rating: 88, basePrice: 1.5, battingRating: 90, bowlingRating: 10, recentForm: 'average', nationality: 'Australia' },
  { id: '18', name: 'Pat Cummins', role: 'Bowler', rating: 91, basePrice: 2.0, battingRating: 60, bowlingRating: 94, recentForm: 'average', nationality: 'Australia' },
  { id: '19', name: 'Andre Russell', role: 'All-rounder', rating: 90, basePrice: 2.0, battingRating: 94, bowlingRating: 85, recentForm: 'hot', nationality: 'West Indies' },
  { id: '20', name: 'Quinton de Kock', role: 'Wicketkeeper', rating: 88, basePrice: 1.5, battingRating: 91, bowlingRating: 0, recentForm: 'hot', nationality: 'South Africa' },
  { id: '21', name: 'Kane Williamson', role: 'Batsman', rating: 89, basePrice: 2.0, battingRating: 92, bowlingRating: 10, recentForm: 'cool', nationality: 'New Zealand' },
  { id: '22', name: 'Mohammed Shami', role: 'Bowler', rating: 90, basePrice: 2.0, battingRating: 20, bowlingRating: 94, recentForm: 'hot', nationality: 'India' },
  { id: '23', name: 'Sunil Narine', role: 'All-rounder', rating: 88, basePrice: 1.5, battingRating: 75, bowlingRating: 92, recentForm: 'hot', nationality: 'West Indies' },
  { id: '24', name: 'Sanju Samson', role: 'Wicketkeeper', rating: 87, basePrice: 1.5, battingRating: 91, bowlingRating: 0, recentForm: 'average', nationality: 'India' },
  { id: '25', name: 'Babar Azam', role: 'Batsman', rating: 92, basePrice: 2.0, battingRating: 94, bowlingRating: 10, recentForm: 'hot', nationality: 'Pakistan' },
  { id: '26', name: 'Shaheen Afridi', role: 'Bowler', rating: 93, basePrice: 2.0, battingRating: 35, bowlingRating: 96, recentForm: 'hot', nationality: 'Pakistan' },
  { id: '27', name: 'Shakib Al Hasan', role: 'All-rounder', rating: 89, basePrice: 1.5, battingRating: 85, bowlingRating: 88, recentForm: 'average', nationality: 'Bangladesh' },
  { id: '28', name: 'Nicholas Pooran', role: 'Wicketkeeper', rating: 88, basePrice: 1.5, battingRating: 92, bowlingRating: 0, recentForm: 'hot', nationality: 'West Indies' },
  { id: '29', name: 'Faf du Plessis', role: 'Batsman', rating: 87, basePrice: 1.5, battingRating: 89, bowlingRating: 10, recentForm: 'average', nationality: 'South Africa' },
  { id: '30', name: 'Mitchell Starc', role: 'Bowler', rating: 92, basePrice: 2.0, battingRating: 40, bowlingRating: 96, recentForm: 'average', nationality: 'Australia' },
  { id: '31', name: 'Marcus Stoinis', role: 'All-rounder', rating: 86, basePrice: 1.0, battingRating: 86, bowlingRating: 70, recentForm: 'average', nationality: 'Australia' },
  { id: '32', name: 'Ishan Kishan', role: 'Wicketkeeper', rating: 86, basePrice: 1.5, battingRating: 89, bowlingRating: 0, recentForm: 'average', nationality: 'India' },
  { id: '33', name: 'Ruturaj Gaikwad', role: 'Batsman', rating: 88, basePrice: 1.0, battingRating: 91, bowlingRating: 5, recentForm: 'hot', nationality: 'India' },
  { id: '34', name: 'Yuzvendra Chahal', role: 'Bowler', rating: 89, basePrice: 1.5, battingRating: 10, bowlingRating: 93, recentForm: 'average', nationality: 'India' },
  { id: '35', name: 'Cameron Green', role: 'All-rounder', rating: 87, basePrice: 1.5, battingRating: 88, bowlingRating: 75, recentForm: 'average', nationality: 'Australia' },
  { id: '36', name: 'Heinrich Klaasen', role: 'Wicketkeeper', rating: 90, basePrice: 1.5, battingRating: 94, bowlingRating: 0, recentForm: 'hot', nationality: 'South Africa' },
  { id: '37', name: 'Yashasvi Jaiswal', role: 'Batsman', rating: 89, basePrice: 1.0, battingRating: 92, bowlingRating: 10, recentForm: 'hot', nationality: 'India' },
  { id: '38', name: 'Mohammed Siraj', role: 'Bowler', rating: 88, basePrice: 1.5, battingRating: 15, bowlingRating: 92, recentForm: 'average', nationality: 'India' },
  { id: '39', name: 'Liam Livingstone', role: 'All-rounder', rating: 85, basePrice: 1.0, battingRating: 90, bowlingRating: 55, recentForm: 'cool', nationality: 'England' },
  { id: '40', name: 'Jonny Bairstow', role: 'Wicketkeeper', rating: 86, basePrice: 1.5, battingRating: 88, bowlingRating: 0, recentForm: 'average', nationality: 'England' },
  { id: '41', name: 'Shreyas Iyer', role: 'Batsman', rating: 87, basePrice: 1.5, battingRating: 89, bowlingRating: 15, recentForm: 'average', nationality: 'India' },
  { id: '42', name: 'Arshdeep Singh', role: 'Bowler', rating: 87, basePrice: 1.0, battingRating: 20, bowlingRating: 91, recentForm: 'average', nationality: 'India' },
  { id: '43', name: 'Sam Curran', role: 'All-rounder', rating: 86, basePrice: 1.5, battingRating: 82, bowlingRating: 88, recentForm: 'average', nationality: 'England' },
  { id: '44', name: 'Rahmanullah Gurbaz', role: 'Wicketkeeper', rating: 84, basePrice: 0.5, battingRating: 87, bowlingRating: 0, recentForm: 'hot', nationality: 'Afghanistan' },
  { id: '45', name: 'Rinku Singh', role: 'Batsman', rating: 88, basePrice: 0.5, battingRating: 92, bowlingRating: 5, recentForm: 'hot', nationality: 'India' },
  { id: '46', name: 'Kuldeep Yadav', role: 'Bowler', rating: 89, basePrice: 1.5, battingRating: 25, bowlingRating: 94, recentForm: 'hot', nationality: 'India' },
  { id: '47', name: 'Axar Patel', role: 'All-rounder', rating: 87, basePrice: 1.5, battingRating: 80, bowlingRating: 91, recentForm: 'hot', nationality: 'India' },
  { id: '48', name: 'Jitesh Sharma', role: 'Wicketkeeper', rating: 83, basePrice: 0.5, battingRating: 85, bowlingRating: 0, recentForm: 'average', nationality: 'India' },
  { id: '49', name: 'Devdutt Padikkal', role: 'Batsman', rating: 82, basePrice: 0.5, battingRating: 84, bowlingRating: 0, recentForm: 'cool', nationality: 'India' },
  { id: '50', name: 'Ravi Bishnoi', role: 'Bowler', rating: 86, basePrice: 1.0, battingRating: 15, bowlingRating: 90, recentForm: 'average', nationality: 'India' },
  { id: '51', name: 'Washington Sundar', role: 'All-rounder', rating: 84, basePrice: 1.0, battingRating: 78, bowlingRating: 86, recentForm: 'average', nationality: 'India' },
  { id: '52', name: 'Phil Salt', role: 'Wicketkeeper', rating: 87, basePrice: 1.0, battingRating: 91, bowlingRating: 0, recentForm: 'hot', nationality: 'England' },
  { id: '53', name: 'Travis Head', role: 'Batsman', rating: 91, basePrice: 2.0, battingRating: 95, bowlingRating: 40, recentForm: 'hot', nationality: 'Australia' },
  { id: '54', name: 'Matheesha Pathirana', role: 'Bowler', rating: 88, basePrice: 1.0, battingRating: 5, bowlingRating: 92, recentForm: 'hot', nationality: 'Sri Lanka' },
  { id: '55', name: 'Rachin Ravindra', role: 'All-rounder', rating: 88, basePrice: 1.0, battingRating: 90, bowlingRating: 70, recentForm: 'average', nationality: 'New Zealand' },
  { id: '56', name: 'Dhruv Jurel', role: 'Wicketkeeper', rating: 82, basePrice: 0.5, battingRating: 86, bowlingRating: 0, recentForm: 'average', nationality: 'India' },
  { id: '57', name: 'Sai Sudharsan', role: 'Batsman', rating: 85, basePrice: 0.5, battingRating: 88, bowlingRating: 5, recentForm: 'average', nationality: 'India' },
  { id: '58', name: 'Lockie Ferguson', role: 'Bowler', rating: 86, basePrice: 1.0, battingRating: 20, bowlingRating: 91, recentForm: 'average', nationality: 'New Zealand' },
  { id: '59', name: 'Mitchell Marsh', role: 'All-rounder', rating: 87, basePrice: 1.5, battingRating: 89, bowlingRating: 75, recentForm: 'average', nationality: 'Australia' },
  { id: '60', name: 'Devon Conway', role: 'Wicketkeeper', rating: 89, basePrice: 1.5, battingRating: 92, bowlingRating: 0, recentForm: 'average', nationality: 'New Zealand' },
];
