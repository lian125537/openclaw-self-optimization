# 史蒂夫·乔布斯直接解决方案
# 创建10个定时任务，每分钟一个

$baseTime = "2026-03-15"
$startHour = 0

for ($i = 0; $i -lt 10; $i++) {
    $minute = 8 + $i
    if ($minute -ge 60) {
        $hour = $startHour + [math]::Floor($minute / 60)
        $minute = $minute % 60
        $timeString = "$baseTimeT{0:00}:{1:00}:00+08:00" -f $hour, $minute
    } else {
        $timeString = "$baseTimeT{0:00}:{1:00}:00+08:00" -f $startHour, $minute
    }
    
    $taskNumber = $i + 1
    Write-Host "创建任务 $taskNumber - 时间: $timeString"
}