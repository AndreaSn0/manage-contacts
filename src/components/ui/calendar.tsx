import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [contactCounts, setContactCounts] = React.useState<{ date: string; count: number }[]>([]);

  // Fetch contact counts on component mount
  React.useEffect(() => {
    const fetchContactCounts = async () => {
      try {
        const response = await fetch(`/api/contacts?range=true`);
        const data = await response.json();
        setContactCounts(data);
      } catch (error) {
        console.error("Error fetching contact counts:", error);
      }
    };

    fetchContactCounts();
  }, []);

  // Create modifiers for different contact counts
  const modifiers = React.useMemo(() => {
    const mods: { [key: string]: (date: Date) => boolean } = {};
    contactCounts.forEach(({ date, count }) => {
      if (count === 1) {
        mods[`yellow-${date}`] = (day: Date) => format(day, "yyyy-MM-dd") === date;
      } else if (count >= 2) {
        mods[`red-${date}`] = (day: Date) => format(day, "yyyy-MM-dd") === date;
      }
    });
    return mods;
  }, [contactCounts]);

  // Create modifier styles
  const modifiersStyles = React.useMemo(() => {
    const styles: { [key: string]: React.CSSProperties } = {};
    contactCounts.forEach(({ date, count }) => {
      if (count === 1) {
        styles[`yellow-${date}`] = { backgroundColor: "rgb(234 179 8)", color: "black" };
      } else if (count >= 2) {
        styles[`red-${date}`] = { backgroundColor: "rgb(239 68 68)", color: "white" };
      }
    });
    return styles;
  }, [contactCounts]);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeftIcon className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRightIcon className="h-4 w-4" />,
      }}
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };