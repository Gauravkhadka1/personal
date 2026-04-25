import { CalendarIcon } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfDay, isSameDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

const NEPAL_TIMEZONE = "Asia/Kathmandu";

const toNepalTime = (date: Date) => {
  return toZonedTime(date, NEPAL_TIMEZONE);
};

export const DateRangePicker = ({
  dateRange,
  tempDateRange,
  isDatePickerOpen,
  setIsDatePickerOpen,
  setDateRange,
  setTempDateRange,
}: {
  dateRange: DateRange | undefined;
  tempDateRange: DateRange | undefined;
  isDatePickerOpen: boolean;
  setIsDatePickerOpen: (open: boolean) => void;
  setDateRange: (range: DateRange | undefined) => void;
  setTempDateRange: (range: DateRange | undefined) => void;
}) => {
  const quickSelectOptions = [
    {
      label: "Today",
      range: {
        from: toNepalTime(new Date()),
        to: toNepalTime(new Date()),
      },
    },
    {
      label: "Yesterday",
      range: {
        from: toNepalTime(subDays(new Date(), 1)),
        to: toNepalTime(subDays(new Date(), 1)),
      },
    },
    {
      label: "This Month",
      range: {
        from: toNepalTime(startOfMonth(new Date())),
        to: toNepalTime(endOfDay(new Date())),
      },
    },
    {
      label: "Previous Month",
      range: {
        from: toNepalTime(startOfMonth(subMonths(new Date(), 1))),
        to: toNepalTime(endOfMonth(subMonths(new Date(), 1))),
      },
    },
    {
      label: "This Year",
      range: {
        from: toNepalTime(startOfYear(new Date())),
        to: toNepalTime(endOfDay(new Date())),
      },
    },
  ];

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setTempDateRange(range);
  };

  const handleApplyDateRange = () => {
    setDateRange(tempDateRange);
    setIsDatePickerOpen(false);
  };

  const handleCancelDateRange = () => {
    setTempDateRange(dateRange);
    setIsDatePickerOpen(false);
  };

  return (
    <div className="flex items-center space-x-2">
      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal md:w-[260px]",
              !dateRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="flex w-auto flex-col p-0 sm:flex-row"
          align="start"
        >
          <div className="flex flex-col border-b p-2 sm:border-b-0 sm:border-r">
            {quickSelectOptions.map((option) => (
              <Button
                key={option.label}
                variant="ghost"
                className={cn(
                  "justify-start text-left text-sm",
                  tempDateRange?.from &&
                    isSameDay(tempDateRange.from, option.range.from) &&
                    (!tempDateRange?.to ||
                      (option.range.to &&
                        isSameDay(tempDateRange.to, option.range.to)))
                    ? "bg-blue-500 text-white"
                    : "",
                )}
                onClick={() => setTempDateRange(option.range)}
              >
                {option.label}
              </Button>
            ))}
            <div className="mt-2 border-t pt-2">
              <Button
                variant="ghost"
                className="justify-start text-left text-sm"
                onClick={() =>
                  setTempDateRange({
                    from: toNepalTime(subDays(new Date(), 7)),
                    to: toNepalTime(new Date()),
                  })
                }
              >
                Last 7 days
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-left text-sm"
                onClick={() =>
                  setTempDateRange({
                    from: toNepalTime(subDays(new Date(), 30)),
                    to: toNepalTime(new Date()),
                  })
                }
              >
                Last 30 days
              </Button>
            </div>
          </div>
          <div className="flex flex-col">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={tempDateRange?.from}
              selected={tempDateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={1}
              className="border-0"
            />
            <div className="flex items-center justify-between border-t p-2">
              <div className="text-sm">
                {tempDateRange?.from && tempDateRange?.to
                  ? `${format(tempDateRange.from, "MMM dd, yyyy")} - ${format(tempDateRange.to, "MMM dd, yyyy")}`
                  : tempDateRange?.from
                    ? format(tempDateRange.from, "MMM dd, yyyy")
                    : "Select a date range"}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancelDateRange}>
                  Cancel
                </Button>
                <Button onClick={handleApplyDateRange}>Apply</Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};