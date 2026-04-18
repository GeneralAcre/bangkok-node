$names = @(
  'global:initialize_community','global:register_member','global:update_reputation',
  'global:create_event','global:start_event','global:check_in',
  'global:record_nft_mint','global:end_event','global:copilot_score_event',
  'account:Community','account:Member','account:Event','account:Attendance'
)
foreach ($n in $names) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($n)
  $hash  = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
  Write-Host ($n + ': [' + ($hash[0..7] -join ',') + ']')
}
