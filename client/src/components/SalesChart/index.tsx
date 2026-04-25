import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MonthlyData {
  month: number;
  monthName: string;
  totalAmount: number;
  paymentCount?: number;
  period?: string;
  // Add category breakdown data
  categories?: {
    domain?: number;
    hosting?: number;
    domain_hosting?: number;
    microsoft?: number;
    website?: number;
    maintenance?: number;
    product?: number;
    other?: number;
  };
}

interface SalesChartProps {
  monthlyData?: MonthlyData[];
  onMonthClick?: (monthNumber: number) => void;
  onCategoryChange?: (category: string) => void;
  currentNepaliMonth?: number;
  currentNepaliYear?: number;
  selectedCategory?: string;
  totalYearlyAmount?: number; // Add this prop
  totalYearlyAmountInWords?: string; // Optional: add words version
}

const SalesChart: React.FC<SalesChartProps> = ({
  monthlyData = [],
  onMonthClick,
  onCategoryChange,
  currentNepaliMonth,
  currentNepaliYear,
  selectedCategory = "All",
  totalYearlyAmount = 0, // Default to 0
  totalYearlyAmountInWords, // Optional
}) => {
  // Find the latest month with data (up to current month)
  const latestMonthWithData = React.useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return 0;
    
    // Get current month if provided, otherwise find latest with data
    if (currentNepaliMonth) {
      return currentNepaliMonth;
    }
    
    return Math.max(
      ...monthlyData.filter((m) => m.totalAmount > 0).map((m) => m.month),
      0
    );
  }, [monthlyData, currentNepaliMonth]);

  // Prepare full 12 months data, marking which months should show actual data
  const fullYearData = React.useMemo(() => {
    // Create array of all 12 months (1-12)
    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);

      // Helper function to get month name (you might want to use your Nepali month names)
  const getMonthName = (monthNum: number): string => {
    const monthNames = [
      "Baisakh", "Jestha", "Ashad", "Shrawan", "Bhadra", "Ashwin",
      "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
    ];
    return monthNames[monthNum - 1] || `Month ${monthNum}`;
  };
    
    const categoryMap: Record<string, string> = {
      Website: "website",
      Hosting: "hosting",
      Maintenance: "maintenance",
      Seo: "seo",
      Domain: "domain",
      Microsoft: "microsoft",
      Product: "product",
      Other: "other",
    };

    return allMonths.map((monthNum) => {
      // Find if we have data for this month
      const existingData = monthlyData.find((m) => m.month === monthNum);
      
      let amount = 0;
      let hasData = false;
      let monthName = "";
      
      if (existingData && existingData.month <= latestMonthWithData) {
        hasData = true;
        monthName = existingData.monthName;
        amount = existingData.totalAmount;
        
        // If a specific category is selected, use the category-specific amount
        if (selectedCategory !== "All" && existingData.categories) {
          const categoryKey = categoryMap[selectedCategory];
          if (
            categoryKey &&
            existingData.categories[categoryKey as keyof typeof existingData.categories]
          ) {
            amount = existingData.categories[categoryKey as keyof typeof existingData.categories] || 0;
          }
        }
      } else {
        // For months without data or upcoming months, generate placeholder name
        monthName = getMonthName(monthNum);
      }
      
      return {
        name: monthName,
        monthNumber: monthNum,
        amount: hasData ? amount : 0,
        hasData: hasData,
        originalData: existingData || null,
        formattedAmount: hasData && amount > 0 ? `${amount.toLocaleString("en-IN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}` : "",
      };
    });
  }, [monthlyData, selectedCategory, latestMonthWithData]);



  // Handle category change
  const handleCategoryChange = (category: string) => {
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  };

  const handleBarClick = (data: any) => {
    if (onMonthClick && data && data.activePayload && data.activePayload[0]) {
      const monthData = data.activePayload[0].payload;
      // Only allow click if month has data
      if (monthData.hasData) {
        onMonthClick(monthData.monthNumber);
      }
    }
  };

  const handleMonthLabelClick = (monthNumber: number, hasData: boolean) => {
    if (onMonthClick && hasData) {
      onMonthClick(monthNumber);
    }
  };

  // Custom XAxis tick component with clickable month labels
  const CustomTick = (props: any) => {
    const { x, y, payload } = props;
    const monthData = fullYearData.find((d) => d.name === payload.value);
    const hasData = monthData?.hasData || false;

    return (
      <g
        onClick={() => {
          if (onMonthClick && monthData) {
            handleMonthLabelClick(monthData.monthNumber, hasData);
          }
        }}
        style={{
          cursor: (onMonthClick && hasData) ? "pointer" : "default",
        }}
      >
        <text
          x={x}
          y={y + 15}
          textAnchor="middle"
          fill={hasData ? "#9CA3AF" : "#D1D5DB"}
          fontSize={12}
          className={hasData ? "transition-colors hover:text-blue-500 dark:hover:text-blue-400" : ""}
          opacity={hasData ? 1 : 0.5}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, height, value, index } = props;
    const dataPoint = fullYearData[index];

    // Don't show label for zero values, upcoming months, or if no data
    if (!value || value === 0 || !dataPoint?.hasData) return null;

    const displayAmount = dataPoint.formattedAmount;

    const labelY = y - 10;
    if (labelY < 0) return null;

    return (
      <text
        x={x + width / 2}
        y={labelY}
        fill="currentColor"
        textAnchor="middle"
        fontSize={10}
        fontWeight="600"
        className="text-gray-900 dark:text-gray-400"
      >
        {displayAmount}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      
      if (!dataPoint.hasData) {
        return (
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-secondary dark:bg-gray-800">
            <p className="font-semibold dark:text-gray-200">{label}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No data available for this month
            </p>
          </div>
        );
      }
      
      const monthAmount = dataPoint.amount;
      const monthData = dataPoint.originalData;

      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-secondary dark:bg-gray-800">
          <p className="mb-2 font-semibold dark:text-gray-200">
            {monthData?.monthName || label}
          </p>
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
            {selectedCategory === "All" ? "Total" : selectedCategory} Amount:{" "}
            <span
              className={monthAmount === 0 ? "text-gray-500" : "text-green-600"}
            >
              {monthAmount === 0
                ? "No Sales"
                : `${monthAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}`}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => {
    if (value >= 10000000) {
      return `${(value / 10000000).toFixed(0)}Cr`;
    } else if (value >= 100000) {
      return `${(value / 100000).toFixed(0)}L`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return `${value}`;
  };

  const renderBar = (props: any) => {
    const { x, y, width, height, payload } = props;
    const hasData = payload.hasData;
    const amount = payload.amount;

    if (!hasData) {
      // Render transparent/empty space for upcoming months
      return <rect x={x} y={y} width={width} height={height} fill="transparent" />;
    }

    if (amount === 0 && hasData) {
      // Render dashed border for months with no sales
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="transparent"
            stroke="#6B7280"
            strokeWidth={1}
            strokeDasharray="2,2"
            rx={4}
          />
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize={10}
            dy=".3em"
          >
            No sales
          </text>
        </g>
      );
    }

    // Render normal bar for months with data
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#3B82F6"
        opacity={0.8}
        rx={4}
      />
    );
  };

  // Format the total yearly amount for display
  const formattedTotalYearlyAmount = totalYearlyAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Custom dot renderer that returns React element instead of null
  const renderDot = (props: any) => {
    const { cx, cy, payload } = props;
    // Only show dots for months with data
    if (!payload.hasData || payload.amount === 0) {
      return <g />; // Return empty group instead of null
    }
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        strokeWidth={2}
        fill="#10B981"
        stroke="#10B981"
      />
    );
  };

  // Custom active dot renderer
  const renderActiveDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload.hasData || payload.amount === 0) {
      return <g />; // Return empty group instead of null
    }
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        strokeWidth={2}
        fill="#10B981"
        stroke="#10B981"
      />
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-secondary dark:bg-secondary">
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold dark:text-gray-200">
              Yearly Sales Overview
            </h2>
            <span className="text-base font-bold text-blue-600 dark:text-blue-400">
              रु {formattedTotalYearlyAmount}
            </span>
            {/* <span className="ml-2">(percentage %) of target target amount</span> */}
          </div>
          {/* Category Tabs */}
          <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
            <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
              <TabsList className="grid w-full grid-cols-9">
                <TabsTrigger value="All">
                  <span className="font-bold">All</span>
                </TabsTrigger>
                <TabsTrigger value="Website">
                  <span className="font-bold">Website/ APP</span>
                </TabsTrigger>
                <TabsTrigger value="Hosting">
                  <span className="font-bold">Hosting</span>
                </TabsTrigger>
                <TabsTrigger value="Maintenance">
                  <span className="font-bold">Maintenance</span>
                </TabsTrigger>
                <TabsTrigger value="Seo">
                  <span className="font-bold">SEO</span>
                </TabsTrigger>
                <TabsTrigger value="Domain">
                  <span className="font-bold">Domain</span>
                </TabsTrigger>
                <TabsTrigger value="Microsoft">
                  <span className="font-bold">Microsoft</span>
                </TabsTrigger>
                <TabsTrigger value="Product">
                  <span className="font-bold">Product</span>
                </TabsTrigger>
                <TabsTrigger value="Other">
                  <span className="font-bold">Other</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={fullYearData}
          margin={{ top: 40, right: 30, left: 0, bottom: 10 }}
          onClick={handleBarClick}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "#374151" }}
            tick={<CustomTick />}
            height={50}
            interval={0}
          />
          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={formatYAxis}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value, entry) => (
              <span style={{ fontSize: "12px" }} className="dark:text-gray-300">
                {value}
              </span>
            )}
          />
          <Bar
            dataKey="amount"
            name={
              selectedCategory === "All"
                ? "Total Sales (रु)"
                : `${selectedCategory} Sales (रु)`
            }
            fill="#3B82F6"
            shape={renderBar}
            cursor={onMonthClick ? "pointer" : "default"}
            className="transition-opacity hover:opacity-70"
          >
            {fullYearData.map((entry, index) => (
              <Cell key={`cell-${index}`} />
            ))}
            <LabelList
              dataKey="amount"
              position="top"
              content={renderCustomBarLabel}
            />
          </Bar>
          <Line
            type="monotone"
            dataKey="amount"
            name="Sales Trend"
            stroke="#10B981"
            strokeWidth={2}
            dot={renderDot}
            activeDot={renderActiveDot}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;