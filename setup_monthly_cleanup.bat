@echo off
echo ========================================
echo OpenClaw 每月清理任务设置
echo ========================================
echo.

echo 1. 创建每月清理任务计划
echo 2. 手动设置任务计划（推荐）
echo 3. 测试清理脚本
echo.

set /p choice="请选择操作 (1-3): "

if "%choice%"=="1" (
    echo 正在尝试自动创建任务计划...
    schtasks /create /tn "OpenClaw Monthly Downloads Cleanup" /tr "powershell -ExecutionPolicy Bypass -File 'C:\Users\yodat\.openclaw\workspace\monthly_cleanup.ps1'" /sc monthly /d 1 /mo 1 /st 02:00 /ru SYSTEM /f
    if %errorlevel% equ 0 (
        echo ✅ 任务计划创建成功！
    ) else (
        echo ❌ 自动创建失败，请使用方法2手动设置
    )
)

if "%choice%"=="2" (
    echo.
    echo 手动设置任务计划步骤：
    echo 1. 打开"任务计划程序"（按 Win+R，输入 taskschd.msc）
    echo 2. 点击"创建基本任务"
    echo 3. 设置任务名称：OpenClaw Monthly Downloads Cleanup
    echo 4. 触发器：每月，选择第一天
    echo 5. 操作：启动程序
    echo 6. 程序：powershell.exe
    echo 7. 参数：-ExecutionPolicy Bypass -File "C:\Users\yodat\.openclaw\workspace\monthly_cleanup.ps1"
    echo 8. 勾选"使用最高权限运行"
    echo 9. 完成设置
    echo.
    pause
)

if "%choice%"=="3" (
    echo 正在测试清理脚本...
    powershell -ExecutionPolicy Bypass -File "C:\Users\yodat\.openclaw\workspace\monthly_cleanup.ps1"
    pause
)

echo.
echo 设置完成！