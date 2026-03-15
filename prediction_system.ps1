# 预测能力系统（续）

class PredictionSystem {
    # 历史数据
    [System.Collections.ArrayList]$HistoricalData = @()
    
    # 预测模型
    [hashtable]$PredictionModels = @{}
    
    # 模式库
    [hashtable]$PatternLibrary = @{}
    
    # 记录历史数据
    [void] RecordData([string]$eventType, [hashtable]$data, [string]$outcome) {
        $record = @{
            event_type = $eventType
            data = $data
            outcome = $outcome
            timestamp = (Get-Date)
        }
        
        $this.HistoricalData.Add($record)
        
        # 更新模式库
        $this.UpdatePatternLibrary($eventType, $data, $outcome)
        
        Write-Host "📝 记录数据: $eventType → $outcome" -ForegroundColor Gray
    }
    
    # 更新模式库
    [void] UpdatePatternLibrary([string]$eventType, [hashtable]$data, [string]$outcome) {
        if (-not $this.PatternLibrary.ContainsKey($eventType)) {
            $this.PatternLibrary[$eventType] = @{
                outcomes = @{}
                data_patterns = @{}
            }
        }
        
        # 记录结果分布
        if (-not $this.PatternLibrary[$eventType].outcomes.ContainsKey($outcome)) {
            $this.PatternLibrary[$eventType].outcomes[$outcome] = 0
        }
        $this.PatternLibrary[$eventType].outcomes[$outcome]++
        
        # 提取数据模式
        foreach ($key in $data.Keys) {
            $value = $data[$key]
            $patternKey = "$key=$value"
            
            if (-not $this.PatternLibrary[$eventType].data_patterns.ContainsKey($patternKey)) {
                $this.PatternLibrary[$eventType].data_patterns[$patternKey] = @{}
            }
            
            if (-not $this.PatternLibrary[$eventType].data_patterns[$patternKey].ContainsKey($outcome)) {
                $this.PatternLibrary[$eventType].data_patterns[$patternKey][$outcome] = 0
            }
            $this.PatternLibrary[$eventType].data_patterns[$patternKey][$outcome]++
        }
    }
    
    # 预测结果
    [hashtable] Predict([string]$eventType, [hashtable]$data) {
        if (-not $this.PatternLibrary.ContainsKey($eventType)) {
            return @{
                prediction = "未知"
                confidence = 0
                reason = "没有足够的历史数据"
            }
        }
        
        $patterns = $this.PatternLibrary[$eventType]
        
        # 计算每个结果的概率
        $probabilities = @{}
        $totalOutcomes = ($patterns.outcomes.Values | Measure-Object -Sum).Sum
        
        foreach ($outcome in $patterns.outcomes.Keys) {
            # 先验概率
            $priorProb = $patterns.outcomes[$outcome] / $totalOutcomes
            
            # 基于数据特征的条件概率
            $likelihood = 1.0
            foreach ($key in $data.Keys) {
                $value = $data[$key]
                $patternKey = "$key=$value"
                
                if ($patterns.data_patterns.ContainsKey($patternKey) -and 
                    $patterns.data_patterns[$patternKey].ContainsKey($outcome)) {
                    
                    $patternTotal = ($patterns.data_patterns[$patternKey].Values | Measure-Object -Sum).Sum
                    $patternOutcomeCount = $patterns.data_patterns[$patternKey][$outcome]
                    $conditionalProb = $patternOutcomeCount / $patternTotal
                    
                    # 简单加权
                    $likelihood *= $conditionalProb
                } else {
                    # 如果没有这个特征的数据，使用平滑
                    $likelihood *= 0.5
                }
            }
            
            # 后验概率（简化版贝叶斯）
            $probabilities[$outcome] = $priorProb * $likelihood
        }
        
        # 归一化
        $totalProb = ($probabilities.Values | Measure-Object -Sum).Sum
        if ($totalProb -gt 0) {
            foreach ($outcome in $probabilities.Keys) {
                $probabilities[$outcome] = $probabilities[$outcome] / $totalProb
            }
        }
        
        # 选择概率最高的结果
        $bestOutcome = $probabilities.Keys | Sort-Object { $probabilities[$_] } -Descending | Select-Object -First 1
        $confidence = [math]::Round($probabilities[$bestOutcome] * 100, 2)
        
        # 生成解释
        $reason = $this.GenerateExplanation($eventType, $data, $bestOutcome, $probabilities)
        
        return @{
            prediction = $bestOutcome
            confidence = $confidence
            probabilities = $probabilities
            reason = $reason
        }
    }
    
    # 生成解释
    [string] GenerateExplanation([string]$eventType, [hashtable]$data, [string]$prediction, [hashtable]$probabilities) {
        $explanations = @()
        
        # 基于历史频率
        $patterns = $this.PatternLibrary[$eventType]
        $totalCases = ($patterns.outcomes.Values | Measure-Object -Sum).Sum
        $predictionCount = $patterns.outcomes[$prediction]
        $frequency = [math]::Round(($predictionCount / $totalCases) * 100, 2)
        
        $explanations += "历史数据显示，类似情况下 '$prediction' 的发生频率为 $frequency%"
        
        # 基于数据特征
        foreach ($key in $data.Keys) {
            $value = $data[$key]
            $patternKey = "$key=$value"
            
            if ($patterns.data_patterns.ContainsKey($patternKey)) {
                $patternData = $patterns.data_patterns[$patternKey]
                $patternTotal = ($patternData.Values | Measure-Object -Sum).Sum
                
                if ($patternData.ContainsKey($prediction)) {
                    $patternProb = [math]::Round(($patternData[$prediction] / $patternTotal) * 100, 2)
                    $explanations += "当 '$key=$value' 时，有 $patternProb% 的情况会出现 '$prediction'"
                }
            }
        }
        
        # 添加概率分布
        $topProbabilities = $probabilities.Keys | Sort-Object { $probabilities[$_] } -Descending | Select-Object -First 3
        $probText = @()
        foreach ($outcome in $topProbabilities) {
            $prob = [math]::Round($probabilities[$outcome] * 100, 2)
            $probText += "$outcome ($prob%)"
        }
        
        $explanations += "概率分布: " + ($probText -join ", ")
        
        return $explanations -join "`n"
    }
    
    # 趋势分析
    [hashtable] AnalyzeTrend([string]$eventType, [int]$days = 7) {
        $recentData = $this.HistoricalData | Where-Object { 
            $_.event_type -eq $eventType -and 
            $_.timestamp -gt (Get-Date).AddDays(-$days)
        }
        
        if ($recentData.Count -eq 0) {
            return @{
                trend = "无数据"
                confidence = 0
                analysis = "最近 $days 天没有相关数据"
            }
        }
        
        # 按时间分组
        $dailyGroups = $recentData | Group-Object { $_.timestamp.Date }
        $dailyOutcomes = @{}
        
        foreach ($day in $dailyGroups) {
            $outcomeGroups = $day.Group | Group-Object outcome
            $dailyOutcomes[$day.Name] = $outcomeGroups
        }
        
        # 分析趋势
        $dates = $dailyOutcomes.Keys | Sort-Object
        $trendData = @()
        
        foreach ($date in $dates) {
            $successCount = ($dailyOutcomes[$date] | Where-Object { $_.Name -eq "成功" }).Count
            $totalCount = ($dailyOutcomes[$date].Group | Measure-Object).Count
            $successRate = if ($totalCount -gt 0) { [math]::Round(($successCount / $totalCount) * 100, 2) } else { 0 }
            
            $trendData += @{
                date = $date
                success_rate = $successRate
                total = $totalCount
            }
        }
        
        # 计算趋势
        if ($trendData.Count -ge 2) {
            $firstRate = $trendData[0].success_rate
            $lastRate = $trendData[-1].success_rate
            $trend = if ($lastRate -gt $firstRate) { "上升" } elseif ($lastRate -lt $firstRate) { "下降" } else { "平稳" }
            $change = [math]::Round($lastRate - $firstRate, 2)
        } else {
            $trend = "数据不足"
            $change = 0
        }
        
        # 生成分析报告
        $analysis = @"
## 趋势分析报告
分析时段: 最近 $days 天
事件类型: $eventType

### 数据统计
- 总事件数: $($recentData.Count)
- 分析天数: $($trendData.Count)
- 平均成功率: $( [math]::Round(($trendData.success_rate | Measure-Object -Average).Average, 2) )%

### 趋势分析
- 整体趋势: $trend
- 变化幅度: $change%
- 最新成功率: $( $trendData[-1].success_rate )%

### 建议
$( $this.GenerateTrendRecommendation($trend, $change, $trendData) )
"@
        
        return @{
            trend = $trend
            change = $change
            confidence = [math]::Round(($trendData.Count / $days) * 100, 2)
            analysis = $analysis
            data = $trendData
        }
    }
    
    # 生成趋势建议
    [string] GenerateTrendRecommendation([string]$trend, [float]$change, [array]$trendData) {
        $recommendations = @()
        
        if ($trend -eq "上升" -and $change -gt 5) {
            $recommendations += "• ✅ 趋势良好，继续保持当前策略"
            $recommendations += "• 📈 考虑扩大成功经验的适用范围"
            $recommendations += "• 🔍 分析成功因素，形成最佳实践"
        } elseif ($trend -eq "下降" -and $change -lt -5) {
            $recommendations += "• ⚠️ 趋势下滑，需要立即关注"
            $recommendations += "• 🔧 分析失败原因，制定改进措施"
            $recommendations += "• 🛡️ 加强监控，防止进一步恶化"
        } elseif ($trend -eq "平稳") {
            $recommendations += "• 📊 趋势平稳，考虑优化提升空间"
            $recommendations += "• 💡 尝试新的方法或技术"
            $recommendations += "• 📈 设定提升目标，持续改进"
        } else {
            $recommendations += "• 🔍 继续观察趋势变化"
            $recommendations += "• 📝 收集更多数据进行分析"
            $recommendations += "• 🎯 设定明确的改进目标"
        }
        
        # 基于具体数据的具体建议
        $latestRate = $trendData[-1].success_rate
        if ($latestRate -lt 70) {
            $recommendations += "• 🚨 当前成功率较低，需要重点改进"
        } elseif ($latestRate -lt 90) {
            $recommendations += "• ⚡ 有提升空间，可以进一步优化"
        } else {
            $recommendations += "• 🎉 表现优秀，考虑分享经验"
        }
        
        return $recommendations -join "`n"
    }
    
    # 风险评估
    [hashtable] AssessRisk([string]$scenario, [hashtable]$factors) {
        $riskScore = 0
        $maxScore = 100
        $riskFactors = @()
        $mitigations = @()
        
        # 评估各个风险因素
        if ($factors.ContainsKey("complexity") -and $factors.complexity -eq "高") {
            $riskScore += 30
            $riskFactors += "• 复杂度高（权重: 30）"
            $mitigations += "• 分阶段实施，降低复杂度"
        }
        
        if ($factors.ContainsKey("newness") -and $factors.newness -eq "新技术") {
            $riskScore += 25
            $riskFactors += "• 使用新技术（权重: 25）"
            $mitigations += "• 充分测试，准备备用方案"
        }
        
        if ($factors.ContainsKey("dependencies") -and $factors.dependencies -gt 3) {
            $riskScore += 20
            $riskFactors += "• 依赖项多（权重: 20）"
            $mitigations += "• 明确依赖关系，制定应对计划"
        }
        
        if ($factors.ContainsKey("timeline") -and $factors.timeline -eq "紧张") {
            $riskScore += 15
            $riskFactors += "• 时间紧张（权重: 15）"
            $mitigations += "• 优先核心功能，灵活调整计划"
        }
        
        if ($factors.ContainsKey("resources") -and $factors.resources -eq "不足") {
            $riskScore += 10
            $riskFactors += "• 资源不足（权重: 10）"
            $mitigations += "• 合理分配资源，寻求外部支持"
        }
        
        # 确定风险等级
        $riskLevel = if ($riskScore -ge 70) { "高" } elseif ($riskScore -ge 40) { "中" } else { "低" }
        
        # 生成风险评估报告
        $report = @"
## 风险评估报告
场景: $scenario

### 风险评分
- 总分: $riskScore / $maxScore
- 风险等级: **$riskLevel**

### 风险因素
$( $riskFactors -join "`n" )

### 缓解措施
$( $mitigations -join "`n" )

### 建议
$( $this.GenerateRiskRecommendation($riskLevel, $riskScore) )
"@
        
        return @{
            score = $riskScore
            level = $riskLevel
            factors = $riskFactors
            mitigations = $mitigations
            report = $report
        }
    }
    
    # 生成风险建议
    [string] GenerateRiskRecommendation([string]$riskLevel, [int]$score) {
        switch ($riskLevel) {
            "高" {
                return @"
• 🚨 **高风险项目**，需要高度重视
• 📋 制定详细的风险管理计划
• 👥 组建专门的风险管理团队
• 🔄 频繁监控和评估风险状态
• 🆘 准备应急预案和回滚方案
"@
            }
            "中" {
                return @"
• ⚠️ **中等风险项目**，需要适当关注
• 📊 定期评估风险变化
• 🛡️ 实施关键风险控制措施
• 📝 记录风险处理过程
• 🔍 监控风险指标
"@
            }
            "低" {
                return @"
• ✅ **低风险项目**，常规管理即可
• 📈 关注可能的风险变化
• 📋 保持基本风险管理
• 🎯 专注于项目执行
• 📊 定期简单评估
"@
            }
            default {
                return "• 🔍 需要进一步评估风险"
            }
        }
    }
    
    # 决策支持
    [hashtable] DecisionSupport([string]$decisionPoint, [array]$options) {
        $analysis = @{}
        
        foreach ($option in $options) {
            # 评估每个选项
            $score = 0
            $pros = @()
            $cons = @()
            
            # 基于简单规则的评估
            if ($option -like "*自动化*") {
                $score += 30
                $pros += "提高效率，减少人工错误"
                $cons += "可能需要更多开发时间"
            }
            
            if ($option -like "*简单*" -or $option -like "*快速*") {
                $score += 20
                $pros += "实施快速，见效快"
                $cons += "可能功能有限"
            }
            
            if ($option -like "*可靠*" -or $option -like "*稳定*") {
                $score += 25
                $pros += "系统稳定，风险低"
                $cons += "可能不够灵活"
            }
            
            if ($option -like "*创新*" -or $option -like "*先进*") {
                $score += 15
                $pros += "技术先进，有竞争优势"
                $cons += "可能存在未知风险"
            }
            
            $analysis[$option] = @{
                score = $score
                pros = $pros
                cons = $cons
                recommendation = if ($score -ge 50) { "推荐" } elseif ($score -ge 30) { "可以考虑" } else { "谨慎选择" }
            }
        }
        
        # 生成决策报告
        $bestOption = $analysis.Keys | Sort-Object { $analysis[$_].score } -Descending | Select-Object -First 1
        
        $report = @"
## 决策支持报告
决策点: $decisionPoint

### 选项分析
$( $this.FormatDecisionAnalysis($analysis) )

### 推荐方案
**$bestOption**
$( $analysis[$bestOption].pros -join "`n" )

### 注意事项
$( $analysis[$bestOption].cons