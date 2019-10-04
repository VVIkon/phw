CREATE OR REPLACE FUNCTION public.fix_max_signal(rec_limit integer DEFAULT 1)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$ 
declare
  scanrow scan%ROWTYPE;
  kmax varchar(100);
  cnt int4 := 0;
 
 /*
 * select public.fix_max_signal(10);
 * 
 * Процедура ремонта максимального значения
 * во входном параметре установить количествл записей кот. нужно отремонтировать
 *  
 */
 
begin
	FOR scanrow IN SELECT * FROM scan s where max_signal like '%-256%' order by id limit rec_limit
	LOOP
		select  
		  '{"'||k.ip::text ||'": '|| k.val::text||'}' as eeq 
		into
		  kmax
		from (
			select
			  f.key::varchar(10) as ip,
			  f.value::int as val
			FROM scan s,
			  json_each_text(s.hosts::json) f
			where s.id = scanrow.id
		) k
		where k.val <> 0
		order by k.val desc
		limit 1;
		 	
	    update scan
	    set max_signal = kmax
	    where id = scanrow.id;
	
	   cnt := cnt+1;
	END LOOP;	
	return cnt;
end
$function$


CREATE OR REPLACE FUNCTION public.mac_moving(macs text, d_begin bigint, d_finish bigint)
 RETURNS TABLE(mac text, ip text, rname text, date_signal_ts bigint, signal numeric)
 LANGUAGE sql
AS $function$ 
	with 
	mac_filter AS (
		select 
			s.max_signal, 
			date_signal, 
			max(s.mac) as mac 
		from scan s 
		where mac in ($1) 
		  and date_signal between $2 and $3 
		group by max_signal, date_signal 
	), 
	split_ip as (
		select 
			max_signal,
			'172.22.36.'||substring(max_signal from 'ip_*([0-9]{1,3})' ) as ip,
			(select cast(substring(max_signal from ':-*([0-9]{1,3})') as numeric )) as signal,
			date_signal as date_signal_ts,
			round(date_signal/1000, 3) as r_date,
			mac
		from mac_filter
	)
	select
	  s.mac,
	  s.ip,
	  (select  (select rm.room_name from rooms rm where rm.id = r."roomId" )as rName from routers r where r.ip = s.ip limit 1) as rName,
	  min(s.date_signal_ts) as date_signal_ts,
	  min(s.signal) as signal
	from split_ip s
	where signal < 257  
	group by mac, ip, r_date
	order by mac, date_signal_ts
$function$


CREATE OR REPLACE FUNCTION public.mac_moving_timing(macs text, d_begin bigint, d_finish bigint)
 RETURNS TABLE(place text, duration numeric)
 LANGUAGE sql
AS $function$ 
with 
	cntDiff AS (
		select aa.rname, 
		aa.date_signal_ts, 
		aa.date_signal_ts - lag(aa.date_signal_ts) over (order by date_signal_ts) as diff
		from (
			select *
			from mac_moving($1, $2, $3)
		) as aa
	),
	clearNegitive as (
	select
	  s.rname,
	  CASE WHEN s.diff<0 THEN 1000
	  	   WHEN s.diff is null THEN 1000	
           ELSE s.diff
       end as diff
	from cntDiff s
	)
select
  c.rname as place,
  --sum(c.diff),
  round(sum(c.diff)/60000,2) as duration
from clearNegitive c
group by c.rname
$function$
