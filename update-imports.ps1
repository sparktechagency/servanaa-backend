Get-ChildItem -Path ".\src" -Recurse -Filter "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $updatedContent = $content -replace '\.ts''', '.js''' -replace '\.ts"', '.js"'
    Set-Content -Path $_.FullName -Value $updatedContent
}
