/**
 * Generate timesheet from the calendar named timesheet.
 * Will look at events one year back.
 *
 * TODO Might need to look a bit into the future for people guessing what they will the for the rest of the week. Maybe by making the user specify start and end dates for the timesheet, or by somehow obtaining all events from the calendar instead of using dates.
 */
function generateTimesheet() 
{
    function log(message)
    {
        Logger.log(message);
    }

    /**
     * Trunkate parts of date after date of month.
     */
    function truncateToDate(date)
    {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
    
    /**
     * Get the start of the day after date.
     */
    function tomorrow(date)
    {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);;
    }
    
    /**
     * Get the start of the day before date.
     */
    function yesterday(date)
    {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
    }
    
    /**
     * Generate day duration tuples for a timespan limited by start and end.
     */
    function getDayAndDuration(start, end)
    {
        var endDay = truncateToDate(end);
        
        log("start: " + start);
        log("truncated start: " + truncateToDate(start));
        log("endday: " + endDay);
        log("tomorrow: " + tomorrow(start));
        
        var durations = [];
        for(var dayIt = new Date(start); truncateToDate(dayIt) <= endDay; dayIt = tomorrow(dayIt))
        {
            log("dayIt: " + dayIt);
            // get either the end of this event, or the start of the next day if this is a multi-day event.
            var endTime = new Date(Math.min(end, tomorrow(dayIt)));
            //yield [truncateToDate(dayIt), endTime - dayIt];
            durations = durations.concat([[truncateToDate(dayIt), endTime - dayIt]]);
        }
        
        return durations;
    }

    function accumulate(map, eventName, key, value)
    {
        log("accumulate start");
        log("eventName: " + eventName);
        log("value: " + value);
        
        if(!map[eventName])
            map[eventName] = [];
        
        var orig = map[eventName][key];
        
        log("orig: " + orig);

        map[eventName][key] = (orig ? orig : 0) + value;

        log("accumulate end");
    }

    /**
     * Sort list in ascending order.
     * Remove duplicate entries.
     */
    function sortUnique(list)
    {
        log("sorting");
        var out = [];

        var minvalue;
        var oldmin = Number.MIN_VALUE;
        // selection sort
        while(true)
        {
            minvalue = Number.MAX_VALUE;
            for(var elem in list)
            {
                log("list[elem] is " + list[elem]);
                if(list[elem] < minvalue && list[elem] > oldmin)
                {
                    log("minvalue is " + list[elem]);
                    minvalue = list[elem];
                }
            }

            if(minvalue == Number.MAX_VALUE)
            {
                break;
            }
            else
            {
                log("inserting value " + minvalue);        
                oldmin = minvalue;
                out.push(minvalue);        
            }
        }
        log("out is " + out);
        return out;          
    }
    
    function dateArray2Time(dates)
    {
        var out = [];
        for(var dateit in dates)
        {
            out.push(dates[dateit].getTime());
        }      
        return out;
    }
    
    function timeArray2Date(times)
    {
        var out = [];
        for(var timeit in times)
        {
            out.push(new Date(times[timeit]));
        }  
        return out;    
    }

    /**
     * TODO is sortedMonthKeys ascending or descending?
     */
    function generateMonthMap(dayMap)
    {
        log("dayMap: " + dayMap);
        var monthMap = [];
        for(var eventName in dayMap)
        {
            log("eventName: " + eventName);
            for(var dayIt in dayMap[eventName])
            {
                log("dayIt: " + dayIt);
                var day = dayMap[eventName][dayIt];
                
                log("day: " + day);
                // accumulate days to months
                accumulate(monthMap, eventName, new Date(new Date(dayIt).getFullYear(), new Date(dayIt).getMonth(), 1), day);
            }
        }
        
        log("monthMap: " + monthMap);
        
        // sort months
        log("sort months");
        var sortedMonthKeys = [];
        for(var eventName in monthMap)
        {
            log("eventName: " + eventName);
            for(var month in monthMap[eventName])
            {
                log("month: " + month);
                sortedMonthKeys = sortedMonthKeys.concat([(new Date(month)).getTime()]);
            }
        }

        sortedMonthKeys = timeArray2Date(sortUnique(sortedMonthKeys).reverse());
        //sortedMonthKeys.sort().reverse();  
        log("sortedMonthKeys " + sortedMonthKeys);
        
        return {"monthMap" : monthMap, "sortedMonthKeys" : sortedMonthKeys};
    }

    /**
     * get the next month
     */
    function nextMonth(date)
    {
        return new Date(date.getFullYear(), date.getMonth() + 1, 1);
    }
    
    function previousMonth(date)
    {
        var newDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
        log("previousMonth start");
        
        log("date: " + date);
        log("newDate: " + newDate);
        
        log("previousMonth end");
        return newDate;
    }
    

    function output(dayMap)
    {
        /**
         * TODO are these functions actually needed? 
         */
        function addColumn(sheet)
        {
            sheet.insertColumnAfter(sheet.getMaxColumns());
        }
        
        /**
         * TODO are these functions actually needed?
         */
        function addRow(sheet)
        {
            sheet.insertRowAfter(sheet.getMaxRows());
        }    
        
        function endOfMonth(date)
        {
            return new Date(date.getFullYear(), date.getMonth() + 1, 0);
        }
        
        function outputMonth(sheet, dayMap, monthMap, month, columnMap)
        {
            var monthName = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
            //var dayName = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
            var dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            
            var month = new Date(month);
            
            // add row for month name printout
            addRow(sheet);
            
            sheet.getRange(sheet.getMaxRows(), 1).setValue(monthName[new Date(month).getMonth()]);
            
            // output month sum
            //for(var eventName
            
            // output the days in reverse chronological order
            for(var day = endOfMonth(month); month.getMonth() == day.getMonth(); day = yesterday(day))
            {
                addRow(sheet);
                
                // first column should be the date
                // just use the toString of the date for now
                sheet.getRange(sheet.getMaxRows(), 1).setValue(day);
                
                // second column is the day of week
                log("day = " + day);
                log("day.getDay() = " + day.getDay());
                log("dayName[day.getDay()] = " + dayName[day.getDay()]);
                sheet.getRange(sheet.getMaxRows(), 2).setValue(dayName[day.getDay()]);
                
                // go through the different events
                for(var eventName in dayMap)
                {
                    var time = dayMap[eventName][day];
                    var hour = time / 3600000.0;
                    // round the hour to two decimals
                    hour = Math.round(hour * 100) / 100;
                    if(time) sheet.getRange(sheet.getMaxRows(), columnMap[eventName]).setValue(hour);
                }
            }
        }
        
        log("start output");  
        var monthData = generateMonthMap(dayMap);
        var monthMap = monthData.monthMap;
        var sortedMonthKeys = monthData.sortedMonthKeys;
        
        var sheet = SpreadsheetApp.getActiveSheet();
        
        log("cleaning spreadsheet");
        // clean the spreadsheet
        sheet.clear();
        
        log("thawing");
        // no frozen sections
        //sheet.setFrozenColumns(0);
        //sheet.setFrozenRows(0);
        
        log("removing rows and columns");
        // remove all rows except the first one
        if(sheet.getMaxRows() > 1) sheet.deleteRows(2, sheet.getMaxRows() - 1);
        // remove all columns except the first one
        if(sheet.getMaxColumns() > 1) sheet.deleteColumns(2, sheet.getMaxColumns() - 1);    
        
        // add a column for the weekdays
        addColumn(sheet);

        // map activity name -> column number
        var columnMap = [];

        // output column headers
        for(var eventName in dayMap)
        {
            log("adding header for  " + eventName);
            // add a new column for each eventName
            addColumn(sheet);
            
            sheet.getRange(1, sheet.getMaxColumns()).setValue(eventName);
            columnMap[eventName] =  sheet.getMaxColumns();
        }
        
        // TODO why does this contain duplicates?
        log("sortedMonthKeys: " + sortedMonthKeys);

        log("sortedMonthKeys[length - 1]: " + sortedMonthKeys[sortedMonthKeys.length - 1]);
        log("previousMonth(new Date(sortedMonthKeys[0])): " + previousMonth(new Date(sortedMonthKeys[0])));
        log("previousMonth(sortedMonthKeys[0] >= sortedMonthKeys[sortedMonthKeys.length - 1: " + (previousMonth(new Date(sortedMonthKeys[0])) >= sortedMonthKeys[sortedMonthKeys.length - 1]));
        // loop through all the months
        for(var month = sortedMonthKeys[0];
            (new Date(month)).getTime() >= (new Date(sortedMonthKeys[sortedMonthKeys.length - 1])).getTime();
            month = previousMonth(new Date(month)))
            //    for(var month = sortedMonthKeys[sortedMonthKeys.length - 1]; 
            //        new Date(month).getTime() >= new Date(sortedMonthKeys[0]).getTime(); 
            //        month = previousMonth(new Date(month)))
        {
            log("month: " + month);
            outputMonth(sheet, dayMap, monthMap, month, columnMap);
        }
        
        log("output done");
    }

    var cal = CalendarApp.openByName("timesheet");
    
    var dayMap = [];
    var now = nextMonth(new Date());
    var events = cal.getEvents(new Date(now.getYear() - 1, now.getMonth(), now.getDate()), now);

    for(var eventIdx in events)
    {
        log("processing event: " + events[eventIdx]);
        
        var durations = getDayAndDuration(events[eventIdx].getStartTime(), events[eventIdx].getEndTime());
        
        for(var durationIdx in durations)
        {
            // accumulate to day
            accumulate(dayMap, events[eventIdx].getTitle(), durations[durationIdx][0], durations[durationIdx][1]);
        }
    }

    log("dayMap dump:");
    for(var key in dayMap)
    {
        log("dayMap[" + key + "] = " + dayMap[key]);  
        for(var subkey in dayMap[key])
        {
            log("daymap[" + key + "][" + subkey + "] = " + dayMap[key][subkey]);  
        }
    }
    
    log("dayMap dump end");


    // output to the spreadsheet
    output(dayMap);
}

