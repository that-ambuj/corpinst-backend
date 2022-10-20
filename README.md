# Corporate Instructor Backend

This is basically a video, audio and text conversion api hosted on http://ec2-13-126-101-66.ap-south-1.compute.amazonaws.com:3000 [^1] as an assignment for https://corporateinstructor.in/

In all the below json requests and responses, `<file on server>` is of format `public/upload/*.extension` and `...response` is just extra info like `status` and `message`

| Endpoint                          | Method | Request Body                                                                        | Response Body                                             |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------- |
| /create_new_storage               | POST   | None                                                                                | sends a cookie named `token`                              |
| /upload_file                      | POST   | `{ "my_file": attached file in a mulipart form }`                                   | `{ "file_path" : "<file on server>" }`                    |
| /text_file_to_audio               | POST   | `{ "file_path" : "<file on server>" }`                                              | `{ "audio_file_path" : "<file on server>", ...response }` |
| /merge_image_and_audio            | POST   | `{ "audio_file_path" : "<file on server>", "image_file_path": "<file on server>" }` | `{ "file_path" : "<file on server>", ...response }`       |
| /merge_video_and_audio            | POST   | `{ "audio_file_path" : "<file on server>", "video_file_path": "<file on server>" }` | `{ "file_path" : "<file on server>", ...response }`       |
| /merge_videos                     | POST   | `{ "video_file_path_list" : [ "<list of files on server>" ] }`                      | `{ "file_path" : "<file on server>", ...response }`       |
| /my_uploaded_files                | GET    | None                                                                                | `{ "data": [ "<list of files on server>" ] }`             |
| /download_file?file_path=`<path>` | GET    | Query String with `file_path` = `<file on server>`                                  | File starts downloading                                  |

[^1]: The URL might change because it's just for demo
