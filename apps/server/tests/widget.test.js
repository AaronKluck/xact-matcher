


const CONFIG = {
  label: "e.g. Sales by month, Orders by region",
  groupBy: "region",
  fields: [
    {
      operation: "sum", // min, avg,
      column: "price"
    },
    {
      operation: "count"
    },
    {
      operation: "subtract",
      column1: "price",
      column2: "cost",
      name: "profit"
    }
  ]
};

const DATA = [
  { "month": "2025-03-01", "region": "West", "price": 1037, "cost": 145.18, "product": "Product B", "quantity": 3 },
  { "month": "2025-02-01", "region": "East", "price": 1344, "cost": 134.4, "product": "Product A", "quantity": 1 },
  { "month": "2025-03-01", "region": "North", "price": 517, "cost": 67.21, "product": "Product B", "quantity": 1 },
  { "month": "2025-05-01", "region": "South", "price": 2277, "cost": 182.16, "product": "Product C", "quantity": 1 },
  { "month": "2025-04-01", "region": "East", "price": 977, "cost": 175.86, "product": "Product D", "quantity": 2 },
  { "month": "2025-01-01", "region": "West", "price": 238, "cost": 42.84, "product": "Product E", "quantity": 2 },
  { "month": "2025-04-01", "region": "West", "price": 1094, "cost": 196.92, "product": "Product D", "quantity": 2 },
  { "month": "2025-02-01", "region": "North", "price": 244, "cost": 43.92, "product": "Product E", "quantity": 1 },
  { "month": "2025-05-01", "region": "West", "price": 1106, "cost": 121.66, "product": "Product D", "quantity": 1 },
  { "month": "2025-01-01", "region": "South", "price": 649, "cost": 77.88, "product": "Product B", "quantity": 3 },
  { "month": "2025-02-01", "region": "West", "price": 2373, "cost": 142.38, "product": "Product C", "quantity": 1 },
  { "month": "2025-03-01", "region": "East", "price": 611, "cost": 91.65, "product": "Product B", "quantity": 1 },
  { "month": "2025-05-01", "region": "North", "price": 1214, "cost": 109.26, "product": "Product A", "quantity": 3 },
  { "month": "2025-04-01", "region": "South", "price": 247, "cost": 49.4, "product": "Product E", "quantity": 1 },
  { "month": "2025-01-01", "region": "East", "price": 1258, "cost": 138.38, "product": "Product A", "quantity": 5 },
  { "month": "2025-04-01", "region": "North", "price": 670, "cost": 100.5, "product": "Product B", "quantity": 1 },
  { "month": "2025-03-01", "region": "South", "price": 1307, "cost": 130.7, "product": "Product A", "quantity": 3 },
  { "month": "2025-05-01", "region": "East", "price": 778, "cost": 139.08, "product": "Product D", "quantity": 10 },
  { "month": "2025-02-01", "region": "South", "price": 2148, "cost": 171.84, "product": "Product C", "quantity": 1 },
  { "month": "2025-01-01", "region": "North", "price": 590, "cost": 106.2, "product": "Product B", "quantity": 1 }
];




/**
 * 
 * const config = {
  label: "e.g. Sales by month, Orders by region",
  groupBy: "region",
  fields: [
     {
       operation: "sum", // min, avg,
       column: "price"
     },
     {
       operation: "count"
     }
  ]
};
 * @param config 
 * @param data 
 */
function widgetizer(config, data) {

  const groups = {};
  for (const d of data) {
    if (!(d[config.groupBy] in groups)) {
      groups[d[config.groupBy]] = [];
    }
    groups[d[config.groupBy]].push(d);
  }

  const result = {};
  for (const [k, v] of Object.entries(groups)) {
    const groupResult = {};
    for (const f of config.fields) {
      if (f.operation === "sum") {
        const col = v.reduce((acc, cur) => {
          acc += cur[f.column];
          return acc;
        }, 0);
        groupResult[f.column] = col;
      } else if (f.operation === "count") {
        groupResult["count"] = v.length;
      } else if (f.operation === "subtract") {
        const col = v.reduce((acc, cur) => {
          acc += cur[f.column1] - cur[f.column2];
          return acc;
        }, 0);
        groupResult[f.name] = col;

      }

    }
    result[k] = groupResult;
  }

  // [1,2,3].reduce((acc, cur) => { acc += cur; return acc;}, 0)

  return result;
}



describe('foo', () => {

  it('bar', () => {
    const result = widgetizer(CONFIG, DATA);
    console.log(JSON.stringify(result));
  });
});