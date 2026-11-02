<?php
// Add this line in routes/api.php right ABOVE the existing public line
//     Route::get('projects/{project}', [ProjectController::class, 'show']);
// (it must come first, or "by-slug" would be read as a project id):

Route::get('projects/by-slug/{slug}', [ProjectController::class, 'showBySlug']);
