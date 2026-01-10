"""
Guahh AI - Parquet to JSONL Converter
Converts parquet training data to JSONL format for memory compilation
"""

import os
import json
import pandas as pd
from pathlib import Path

def convert_parquet_to_jsonl(parquet_dir, output_dir):
    """
    Convert all parquet files in a directory to JSONL format
    """
    parquet_path = Path(parquet_dir)
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    print(f"Converting parquet files from: {parquet_dir}")
    
    parquet_files = list(parquet_path.glob("*.parquet"))
    total_rows = 0
    
    for parquet_file in parquet_files:
        print(f"  Processing {parquet_file.name}...")
        
        try:
            # Read parquet file
            df = pd.read_parquet(parquet_file)
            
            # Output JSONL file
            output_file = output_path / f"{parquet_file.stem}.jsonl"
            
            with open(output_file, 'w', encoding='utf-8') as f:
                for idx, row in df.iterrows():
                    # Convert row to dictionary
                    row_dict = row.to_dict()
                    
                    # Try to extract conversation format
                    # Common formats: 'messages', 'conversations', 'prompt/completion'
                    jsonl_obj = None
                    
                    if 'messages' in row_dict:
                        jsonl_obj = {'messages': row_dict['messages']}
                    elif 'conversations' in row_dict:
                        # Convert conversations to messages format
                        convos = row_dict['conversations']
                        if isinstance(convos, list):
                            messages = []
                            for c in convos:
                                if isinstance(c, dict) and 'role' in c and 'content' in c:
                                    messages.append({'role': c['role'], 'content': c['content']})
                            if messages:
                                jsonl_obj = {'messages': messages}
                    elif 'prompt' in row_dict and 'completion' in row_dict:
                        # Convert prompt/completion to messages format
                        jsonl_obj = {
                            'messages': [
                                {'role': 'user', 'content': str(row_dict['prompt'])},
                                {'role': 'assistant', 'content': str(row_dict['completion'])}
                            ]
                        }
                    elif 'text' in row_dict:
                        # Plain text format - treat as assistant response
                        jsonl_obj = {
                            'messages': [
                                {'role': 'assistant', 'content': str(row_dict['text'])}
                            ]
                        }
                    else:
                        # Try to infer from column names
                        cols = list(row_dict.keys())
                        if len(cols) >= 2:
                            # Assume first column is user, second is assistant
                            jsonl_obj = {
                                'messages': [
                                    {'role': 'user', 'content': str(row_dict[cols[0]])},
                                    {'role': 'assistant', 'content': str(row_dict[cols[1]])}
                                ]
                            }
                    
                    if jsonl_obj:
                        f.write(json.dumps(jsonl_obj, ensure_ascii=False) + '\n')
                        total_rows += 1
            
            print(f"    ✓ Converted {len(df)} rows")
            
        except Exception as e:
            print(f"    ✗ Error processing {parquet_file.name}: {e}")
    
    print(f"\nTotal rows converted: {total_rows}")
    print(f"Output directory: {output_dir}")
    return total_rows

if __name__ == "__main__":
    # Paths
    base_path = r"C:\Users\Taj\Downloads\Guahh AI"
    data2_dir = os.path.join(base_path, "data2")
    output_dir = os.path.join(base_path, "data2_converted")
    
    # Check if pandas and pyarrow are available
    try:
        import pandas as pd
        import pyarrow.parquet as pq
    except ImportError:
        print("ERROR: Required libraries not found!")
        print("Please install: pip install pandas pyarrow")
        exit(1)
    
    # Run conversion
    if os.path.exists(data2_dir):
        convert_parquet_to_jsonl(data2_dir, output_dir)
        print("\n✓ Conversion complete!")
    else:
        print(f"ERROR: Directory not found: {data2_dir}")
