# YouTube视频分析工具
# 分析视频内容是否对AI助手有用

param(
    [string]$VideoId = "MtukF1C8epQ",
    [switch]$QuickAnalysis = $true
)

Write-Host "🎬 YouTube视频分析工具" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor DarkGray
Write-Host "视频ID: $VideoId" -ForegroundColor Yellow
Write-Host "链接: https://www.youtube.com/watch?v=$VideoId" -ForegroundColor Gray
Write-Host "=" * 50 -ForegroundColor DarkGray

# 有用性评估标准
$UsefulnessCriteria = @{
    # 技术相关（高价值）
    "AI/机器学习" = @{
        Weight = 10
        Keywords = @("AI", "人工智能", "机器学习", "神经网络", "深度学习", "模型训练")
    }
    "编程开发" = @{
        Weight = 8
        Keywords = @("编程", "代码", "开发", "Python", "JavaScript", "Git", "API")
    }
    "系统工具" = @{
        Weight = 7
        Keywords = @("工具", "软件", "系统", "优化", "配置", "设置", "自动化")
    }
    "OpenClaw相关" = @{
        Weight = 9
        Keywords = @("OpenClaw", "AI助手", "聊天机器人", "自动化", "工作流")
    }
    
    # 技能相关（中价值）
    "学习技巧" = @{
        Weight = 6
        Keywords = @("学习", "教程", "指南", "教学", "培训", "技能")
    }
    "效率提升" = @{
        Weight = 6
        Keywords = @("效率", "生产力", "时间管理", "工作流", "优化")
    }
    "沟通技巧" = @{
        Weight = 5
        Keywords = @("沟通", "交流", "表达", "写作", "演讲")
    }
    
    # 通用知识（低价值）
    "科技新闻" = @{
        Weight = 4
        Keywords = @("科技", "新闻", "趋势", "更新", "发布")
    }
    "基础知识" = @{
        Weight = 3
        Keywords = @("基础", "入门", "概念", "原理", "介绍")
    }
    
    # 娱乐内容（有限价值）
    "娱乐音乐" = @{
        Weight = 1
        Keywords = @("音乐", "娱乐", "游戏", "搞笑", "娱乐")
    }
    "生活日常" = @{
        Weight = 1
        Keywords = @("生活", "日常", "vlog", "旅行", "美食")
    }
}

# 尝试获取视频信息
function Get-VideoInfo {
    param([string]$Id)
    
    $videoInfo = @{
        Title = "未知标题"
        Description = "无描述"
        Channel = "未知频道"
        Duration = "未知时长"
        Views = "未知观看数"
        UploadDate = "未知日期"
    }
    
    # 方法1：尝试通过oEmbed API
    try {
        $apiUrl = "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=$Id&format=json"
        $response = Invoke-WebRequest -Uri $apiUrl -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            $videoInfo.Title = $data.title
            $videoInfo.Channel = $data.author_name
        }
    } catch {
        Write-Host "  ⚠️ oEmbed API不可用" -ForegroundColor Yellow
    }
    
    # 方法2：尝试通过网页抓取（简化版）
    try {
        $webUrl = "https://www.youtube.com/watch?v=$Id"
        $html = Invoke-WebRequest -Uri $webUrl -TimeoutSec 10 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Content
        
        # 简单提取标题（如果可能）
        if ($html -match '<title[^>]*>([^<]+)</title>') {
            $title = $matches[1].Replace(" - YouTube", "").Trim()
            if ($title -and $title -ne "YouTube") {
                $videoInfo.Title = $title
            }
        }
    } catch {
        Write-Host "  ⚠️ 网页抓取失败" -ForegroundColor Yellow
    }
    
    return $videoInfo
}

# 分析视频有用性
function Analyze-Usefulness {
    param(
        [hashtable]$VideoInfo,
        [hashtable]$Criteria
    )
    
    $analysis = @{
        TotalScore = 0
        MaxPossibleScore = 0
        Categories = @()
        UsefulnessLevel = "未知"
        Recommendations = @()
    }
    
    $title = $VideoInfo.Title.ToLower()
    $description = $VideoInfo.Description.ToLower()
    
    # 分析每个类别
    foreach ($category in $Criteria.Keys) {
        $categoryInfo = $Criteria[$category]
        $score = 0
        
        # 检查关键词匹配
        foreach ($keyword in $categoryInfo.Keywords) {
            $keywordLower = $keyword.ToLower()
            if ($title -match $keywordLower -or $description -match $keywordLower) {
                $score += $categoryInfo.Weight
                break  # 每个类别只计一次分
            }
        }
        
        if ($score -gt 0) {
            $analysis.Categories += @{
                Name = $category
                Score = $score
                Weight = $categoryInfo.Weight
            }
            $analysis.TotalScore += $score
        }
        
        $analysis.MaxPossibleScore += $categoryInfo.Weight
    }
    
    # 计算有用性等级
    if ($analysis.MaxPossibleScore -gt 0) {
        $percentage = ($analysis.TotalScore / $analysis.MaxPossibleScore) * 100
        
        if ($percentage -ge 70) {
            $analysis.UsefulnessLevel = "非常高"
            $analysis.Recommendations += "强烈推荐观看和学习"
            $analysis.Recommendations += "可能包含重要技术信息"
        } elseif ($percentage -ge 50) {
            $analysis.UsefulnessLevel = "高"
            $analysis.Recommendations += "建议观看"
            $analysis.Recommendations += "可能有实用价值"
        } elseif ($percentage -ge 30) {
            $analysis.UsefulnessLevel = "中等"
            $analysis.Recommendations += "选择性观看"
            $analysis.Recommendations += "部分内容可能有用"
        } elseif ($percentage -ge 10) {
            $analysis.UsefulnessLevel = "低"
            $analysis.Recommendations += "兴趣导向观看"
            $analysis.Recommendations += "核心价值有限"
        } else {
            $analysis.UsefulnessLevel = "非常低"
            $analysis.Recommendations += "娱乐性质"
            $analysis.Recommendations += "对AI助手帮助有限"
        }
    }
    
    return $analysis
}

# 生成分析报告
function Generate-Report {
    param(
        [hashtable]$VideoInfo,
        [hashtable]$Analysis
    )
    
    Write-Host "`n📊 视频分析报告" -ForegroundColor Cyan
    Write-Host "─" * 40 -ForegroundColor DarkGray
    
    Write-Host "📺 视频信息：" -ForegroundColor Yellow
    Write-Host "  标题: $($VideoInfo.Title)" -ForegroundColor Gray
    Write-Host "  频道: $($VideoInfo.Channel)" -ForegroundColor Gray
    Write-Host "  链接: https://www.youtube.com/watch?v=$VideoId" -ForegroundColor Gray
    
    Write-Host "`n🎯 有用性分析：" -ForegroundColor Yellow
    Write-Host "  等级: $($Analysis.UsefulnessLevel)" -ForegroundColor $(
        switch ($Analysis.UsefulnessLevel) {
            "非常高" { "Green" }
            "高" { "Green" }
            "中等" { "Yellow" }
            "低" { "Red" }
            "非常低" { "Red" }
            default { "Gray" }
        }
    )
    
    if ($Analysis.Categories.Count -gt 0) {
        Write-Host "  相关类别：" -ForegroundColor Gray
        foreach ($cat in $Analysis.Categories) {
            Write-Host "    • $($cat.Name) (权重: $($cat.Weight), 得分: $($cat.Score))" -ForegroundColor Gray
        }
    }
    
    Write-Host "`n📈 得分: $($Analysis.TotalScore)/$($Analysis.MaxPossibleScore)" -ForegroundColor Cyan
    
    Write-Host "`n💡 建议：" -ForegroundColor Yellow
    foreach ($rec in $Analysis.Recommendations) {
        Write-Host "  • $rec" -ForegroundColor Gray
    }
    
    # 具体建议
    Write-Host "`n🚀 具体行动建议：" -ForegroundColor Cyan
    
    if ($Analysis.UsefulnessLevel -in @("非常高", "高")) {
        Write-Host "  ✅ 立即观看并学习" -ForegroundColor Green
        Write-Host "  ✅ 提取关键知识点" -ForegroundColor Green
        Write-Host "  ✅ 应用到实际工作中" -ForegroundColor Green
        Write-Host "  ✅ 分享给其他AI助手" -ForegroundColor Green
    } elseif ($Analysis.UsefulnessLevel -eq "中等") {
        Write-Host "  ⚠️ 选择性观看相关部分" -ForegroundColor Yellow
        Write-Host "  ⚠️ 关注具体技术细节" -ForegroundColor Yellow
        Write-Host "  ⚠️ 评估实际应用价值" -ForegroundColor Yellow
    } else {
        Write-Host "  ❌ 优先处理其他任务" -ForegroundColor Red
        Write-Host "  ❌ 如有兴趣可稍后观看" -ForegroundColor Gray
        Write-Host "  ❌ 关注更相关的资源" -ForegroundColor Gray
    }
}

# 主分析流程
Write-Host "🔍 获取视频信息..." -ForegroundColor Yellow
$videoInfo = Get-VideoInfo -Id $VideoId

Write-Host "`n🧠 分析视频有用性..." -ForegroundColor Yellow
$analysis = Analyze-Usefulness -VideoInfo $videoInfo -Criteria $UsefulnessCriteria

# 生成报告
Generate-Report -VideoInfo $videoInfo -Analysis $analysis

# 快速分析模式
if ($QuickAnalysis) {
    Write-Host "`n⚡ 快速分析结论：" -ForegroundColor Cyan
    
    switch ($analysis.UsefulnessLevel) {
        { $_ -in @("非常高", "高") } {
            Write-Host "  ✅ 这个视频对AI助手很有用！" -ForegroundColor Green
            Write-Host "    可能包含：技术教程、工具使用、效率提升等内容" -ForegroundColor Gray
        }
        "中等" {
            Write-Host "  ⚠️ 这个视频可能部分有用" -ForegroundColor Yellow
            Write-Host "    需要具体查看内容确定价值" -ForegroundColor Gray
        }
        { $_ -in @("低", "非常低") } {
            Write-Host "  ❌ 这个视频对AI助手帮助有限" -ForegroundColor Red
            Write-Host "    可能是娱乐或非技术内容" -ForegroundColor Gray
        }
    }
}

Write-Host "`n🎯 最终回答波哥的问题：" -ForegroundColor Cyan
Write-Host "这个YouTube视频（$VideoId）对AI助手是否有用，取决于其内容。" -ForegroundColor Gray
Write-Host "根据分析，有用性等级为：$($analysis.UsefulnessLevel)" -ForegroundColor $(
    switch ($analysis.UsefulnessLevel) {
        { $_ -in @("非常高", "高") } { "Green" }
        "中等" { "Yellow" }
        { $_ -in @("低", "非常低") } { "Red" }
        default { "Gray" }
    }
)