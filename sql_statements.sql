select 
    AVG(VALUE), 
    DATETIME(round(strftime('%s',TIME)/300-0.5)*300,'unixepoch') TSLICE,
    count(*) CNT
from 
    Actual_values 
where 
    measurement='TEMPERATURE' and 
    channel='MEQ0211354:1' and 
    TIME>'2020-05-14T00:00:00'
    and TIME < '2020-05-15T00:00:00'
group by 
    TSLICE
order by 
    TSLICE;