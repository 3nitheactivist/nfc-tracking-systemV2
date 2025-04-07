import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title,
  Filler,
  RadialLinearScale
} from 'chart.js';

// Register all ChartJS components
ChartJS.register(
  ArcElement,           // For Pie and Doughnut charts
  Tooltip,              // For tooltips
  Legend,               // For legends
  CategoryScale,        // For bar/line charts
  LinearScale,          // For bar/line charts
  PointElement,         // For scatter/line charts
  LineElement,          // For line charts
  BarElement,           // For bar charts
  Title,                // For chart titles
  Filler,               // For area charts
  RadialLinearScale     // For radar charts
);

export default ChartJS; 