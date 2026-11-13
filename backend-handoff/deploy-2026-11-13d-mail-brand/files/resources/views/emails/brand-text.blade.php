{{ $m['title'] }}

@if ($m['greeting'] !== '')
{{ $m['greeting'] }}

@endif
@foreach ($m['lines'] as $line)
{{ $line }}

@endforeach
@if ($m['code'])
رمزك:  {{ $m['code'] }}

@endif
@if ($m['cta'])
{{ $m['cta']['label'] }}: {{ $m['cta']['url'] }}

@endif
@foreach ($m['after'] as $line)
{{ $line }}

@endforeach
@if ($m['note'] !== '')
{{ $m['note'] }}

@endif
—
مؤسسة اليسر الخيرية · مشهرة برقم 2665 لسنة 2019
المنصورة · +20 109 700 0137 · info@elyusr.org
{{ $m['site'] }}
