output "state_machine_arn" {
  value = aws_sfn_state_machine.agent.arn
}

output "state_machine_name" {
  value = aws_sfn_state_machine.agent.name
}
