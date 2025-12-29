import { InventoryItem } from "./mcdm";

// Extended sample data to simulate 700 items
const baseData: Omit<InventoryItem, "id">[] = [
  { Risk: "High", "Demand fluctuation": "Ending", "Average stock": 110.34, "Daily usage": 4.94, "Unit cost": 7.64446, "Lead time": 23, "Consignment stock": "Yes", "Unit size": "Large" },
  { Risk: "Normal", "Demand fluctuation": "Ending", "Average stock": 183.26, "Daily usage": 1.58, "Unit cost": 2.50913, "Lead time": 10, "Consignment stock": "No", "Unit size": "Large" },
  { Risk: "Normal", "Demand fluctuation": "Stable", "Average stock": 115.42, "Daily usage": 3.29, "Unit cost": 6.25884, "Lead time": 17, "Consignment stock": "No", "Unit size": "Medium" },
  { Risk: "Low", "Demand fluctuation": "Stable", "Average stock": 113.85, "Daily usage": 0.26, "Unit cost": 4.95187, "Lead time": 19, "Consignment stock": "Yes", "Unit size": "Large" },
  { Risk: "Normal", "Demand fluctuation": "Decreasing", "Average stock": 149.02, "Daily usage": 4.93, "Unit cost": 6.48226, "Lead time": 24, "Consignment stock": "Yes", "Unit size": "Small" },
  { Risk: "High", "Demand fluctuation": "Increasing", "Average stock": 200.15, "Daily usage": 8.50, "Unit cost": 12.5432, "Lead time": 28, "Consignment stock": "No", "Unit size": "Large" },
  { Risk: "High", "Demand fluctuation": "Increasing", "Average stock": 175.32, "Daily usage": 7.25, "Unit cost": 9.87654, "Lead time": 25, "Consignment stock": "No", "Unit size": "Large" },
  { Risk: "Normal", "Demand fluctuation": "Increasing", "Average stock": 160.45, "Daily usage": 6.80, "Unit cost": 8.12345, "Lead time": 20, "Consignment stock": "No", "Unit size": "Large" },
  { Risk: "High", "Demand fluctuation": "Stable", "Average stock": 145.67, "Daily usage": 5.50, "Unit cost": 10.2345, "Lead time": 22, "Consignment stock": "No", "Unit size": "Large" },
  { Risk: "Normal", "Demand fluctuation": "Increasing", "Average stock": 190.23, "Daily usage": 7.90, "Unit cost": 11.5678, "Lead time": 26, "Consignment stock": "No", "Unit size": "Medium" },
];

const riskOptions = ["High", "Normal", "Low"];
const demandOptions = ["Increasing", "Stable", "Unknown", "Decreasing", "Ending"];
const consignmentOptions = ["Yes", "No"];
const sizeOptions = ["Large", "Medium", "Small"];

function seededRandom(seed: number): () => number {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function generateSampleData(count: number = 700): InventoryItem[] {
  const random = seededRandom(42);
  const items: InventoryItem[] = [];

  for (let i = 0; i < count; i++) {
    if (i < baseData.length) {
      items.push({ ...baseData[i], id: i + 1 });
    } else {
      const risk = riskOptions[Math.floor(random() * riskOptions.length)];
      const demand = demandOptions[Math.floor(random() * demandOptions.length)];
      const consignment = consignmentOptions[Math.floor(random() * consignmentOptions.length)];
      const size = sizeOptions[Math.floor(random() * sizeOptions.length)];

      items.push({
        id: i + 1,
        Risk: risk,
        "Demand fluctuation": demand,
        "Average stock": 50 + random() * 200,
        "Daily usage": random() * 10,
        "Unit cost": 1 + random() * 15,
        "Lead time": 5 + Math.floor(random() * 25),
        "Consignment stock": consignment,
        "Unit size": size,
      });
    }
  }

  return items;
}

export const SAMPLE_CSV_STRING = `Risk,Demand fluctuation,Average stock,Daily usage,Unit cost,Lead time,Consignment stock,Unit size
High,Ending,110.34,4.94,7.64446,23,Yes,Large
Normal,Ending,183.26,1.58,2.50913,10,No,Large
Normal,Stable,115.42,3.29,6.25884,17,No,Medium
Low,Stable,113.85,0.26,4.95187,19,Yes,Large
Normal,Decreasing,149.02,4.93,6.48226,24,Yes,Small
High,Increasing,200.15,8.50,12.5432,28,No,Large
High,Increasing,175.32,7.25,9.87654,25,No,Large
Normal,Increasing,160.45,6.80,8.12345,20,No,Large
High,Stable,145.67,5.50,10.2345,22,No,Large
Normal,Increasing,190.23,7.90,11.5678,26,No,Medium`;
